// src/services/mockReplay/engine.ts
import localDayJs from "@services/localDayJs";
import constants from "@config/floodPredictionConstants.json";
import { MapQuantiles } from "@services/floodPrediction/types";

import { buildEmpiricalRating } from "./empiricalRating";
import { createAnchor, effectiveMockNow, shiftToDisplay, TimeAnchor } from "./timeShift";
import { isMockReplayActive } from "./mockReplayState";
import { toGaugeLocalString } from "./timestamps";
import { computeStatus, computeTrendRates } from "./status";
import { synthesizeForecast } from "./forecastSynthesis";
import { synthesizeBands } from "./percentileBands";
import { MockReplayScenario, RatingCurve, RawReading } from "./types";

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;
const PRELOAD_BEHIND_DAYS = 16; // covers the 14-day chart range + buffer
const PRELOAD_AHEAD_DAYS = 10; // forecast horizon + reveal-as-time-advances
const RECENT_WINDOW_MS = 2 * DAY_MS;

export interface GaugeCache {
  readings: RawReading[]; // ascending by timestampMs
  rating: RatingCurve;
  yellowStage?: number;
  redStage?: number;
}

export interface MockReplayContext {
  scenario: MockReplayScenario;
  timezone: string;
  /** Wall clock at init; defaults to Date.now(). Test seam. */
  nowMs?: number;
  locationIds: string[];
  forecastGageIds: string[];
  stagesByLocation: Record<string, { yellowStage?: number; redStage?: number }>;
  fetchRawReadings: (locationId: string, fromMs: number, toMs: number) => Promise<RawReading[]>;
  /**
   * Returns the REAL dashboard gage skeletons (full metadata: locationName, rank,
   * isOffline, timeZoneName, etc.) so we can merge mock readings/status into them.
   * Optional in tests. Without it the dashboard build falls back to minimal objects.
   */
  fetchDashboardSkeletons?: () => Promise<any[]>;
}

let anchor: TimeAnchor | null = null;
let timezone = "America/Los_Angeles";
let scenario: MockReplayScenario | null = null;
let preloading = false;
const cache = new Map<string, GaugeCache>();
// Real dashboard gage skeletons keyed by locationId — preserves full metadata
// that buildStatusAndRecentReadings merges mock readings/status into.
const dashboardSkeletons = new Map<string, any>();

export function __resetEngineForTest() {
  anchor = null;
  scenario = null;
  preloading = false;
  cache.clear();
  dashboardSkeletons.clear();
}

/** True once init() has run (anchor + cache populated), regardless of param state. */
export function isInitialized(): boolean {
  return anchor !== null;
}

/**
 * Runtime gate used by the API/bands seams: the engine must be initialized AND the
 * URL/persistence state still active. The second check lets a mid-session
 * `?mock=reset` stop mocking without a reload.
 */
export function isActive(): boolean {
  return isInitialized() && isMockReplayActive();
}

export function isPreloading(): boolean {
  return preloading;
}

export function effectiveMockNowMs(nowMs: number = Date.now()): number {
  return anchor ? effectiveMockNow(anchor, nowMs) : nowMs;
}

export function getTimezone(): string {
  return timezone;
}

export function getScenario(): MockReplayScenario | null {
  return scenario;
}

export function getAnchor(): TimeAnchor | null {
  return anchor;
}

export function getCache(id: string): GaugeCache | undefined {
  return cache.get(id);
}

export async function init(ctx: MockReplayContext): Promise<void> {
  const nowMs = ctx.nowMs ?? Date.now();
  const mockNowMs = localDayJs
    .tz(ctx.scenario.mockNow, "YYYY-MM-DDTHH:mm:ss", ctx.timezone)
    .valueOf();

  scenario = ctx.scenario;
  timezone = ctx.timezone;
  anchor = createAnchor(mockNowMs, nowMs);

  const fromMs = mockNowMs - PRELOAD_BEHIND_DAYS * DAY_MS;
  const toMs = mockNowMs + PRELOAD_AHEAD_DAYS * DAY_MS;
  const ids = Array.from(new Set([...ctx.locationIds, ...ctx.forecastGageIds]));

  preloading = true;
  try {
    for (const id of ids) {
      const readings = (await ctx.fetchRawReadings(id, fromMs, toMs))
        .slice()
        .sort((a, b) => a.timestampMs - b.timestampMs);
      const stages = ctx.stagesByLocation[id] ?? {};
      cache.set(id, {
        readings,
        rating: buildEmpiricalRating(readings),
        yellowStage: stages.yellowStage,
        redStage: stages.redStage,
      });
    }
    if (ctx.fetchDashboardSkeletons) {
      const skeletons = await ctx.fetchDashboardSkeletons();
      for (const g of skeletons ?? []) {
        if (g?.locationId) {
          dashboardSkeletons.set(g.locationId, g);
        }
      }
    }
  } finally {
    preloading = false;
  }
}

// --- shape builders ---

function readingsUpTo(c: GaugeCache, cutoffMs: number): RawReading[] {
  return c.readings.filter((r) => r.timestampMs <= cutoffMs);
}

/** Shifted, gauge-local GageReading objects for [cutoff - window, cutoff], ascending. */
function shiftedReadingObjects(c: GaugeCache, cutoffMs: number, windowMs: number) {
  const from = cutoffMs - windowMs;
  return c.readings
    .filter((r) => r.timestampMs >= from && r.timestampMs <= cutoffMs)
    .map((r) => ({
      timestamp: toGaugeLocalString(shiftToDisplay(anchor!, r.timestampMs), timezone),
      waterHeight: r.waterHeight,
      waterDischarge: r.waterDischarge,
      isDeleted: false,
      isMissing: false,
    }));
}

function statusBlock(c: GaugeCache, cutoffMs: number) {
  const upTo = readingsUpTo(c, cutoffMs);
  const recent = upTo.slice(-12); // last ~12 readings drive trend
  const status = computeStatus({
    readings: recent,
    yellowStage: c.yellowStage,
    redStage: c.redStage,
  });
  const last = upTo[upTo.length - 1];
  const lastReading = last
    ? {
        timestamp: toGaugeLocalString(shiftToDisplay(anchor!, last.timestampMs), timezone),
        waterHeight: last.waterHeight,
        waterDischarge: last.waterDischarge,
        isDeleted: false,
      }
    : undefined;
  return { ...status, lastReading };
}

function predictionObjects(c: GaugeCache, cutoffMs: number) {
  if (!scenario) {
    return [];
  }
  const issuanceMs = cutoffMs - scenario.forecastAgeHours * HOUR_MS;
  const points = synthesizeForecast({
    actual: c.readings,
    issuanceMs,
    deviationPct: scenario.forecastDeviationPct,
    rating: c.rating,
  });
  return points.map((p) => ({
    timestamp: toGaugeLocalString(shiftToDisplay(anchor!, p.timestampMs), timezone),
    waterHeight: p.stage,
    waterDischarge: p.discharge,
    isDeleted: false,
  }));
}

/** Single-gauge shape for api.getGageReadings (live). */
export function buildGageReadings(locationId: string, nowMs: number = Date.now()) {
  const c = cache.get(locationId);
  const cutoff = effectiveMockNowMs(nowMs);
  const empty = {
    noData: true,
    lastReadingId: undefined as number | undefined,
    readings: [] as ReturnType<typeof shiftedReadingObjects>,
    status: undefined as ReturnType<typeof statusBlock> | undefined,
    peakStatus: undefined as ReturnType<typeof statusBlock> | undefined,
    predictedFeetPerHour: 0,
    predictedCfsPerHour: 0,
    predictions: [] as ReturnType<typeof predictionObjects>,
  };
  if (!c || readingsUpTo(c, cutoff).length === 0) {
    return empty;
  }
  const rates = computeTrendRates(readingsUpTo(c, cutoff).slice(-3));
  return {
    ...empty,
    noData: false,
    readings: shiftedReadingObjects(c, cutoff, RECENT_WINDOW_MS),
    status: statusBlock(c, cutoff),
    peakStatus: statusBlock(c, cutoff),
    predictedFeetPerHour: rates.feetPerHour,
    predictedCfsPerHour: rates.cfsPerHour,
    predictions: predictionObjects(c, cutoff),
  };
}

/**
 * Dashboard shape for api.getStatusAndRecentReadings. Merges mock readings/status
 * onto the REAL gage skeleton (preserving locationName, rank, isOffline, etc.) so
 * the home list/map keep their metadata across mocked polls. When `locationIds`
 * is omitted, uses every cached gauge.
 */
export function buildStatusAndRecentReadings(locationIds?: string[], nowMs: number = Date.now()) {
  const cutoff = effectiveMockNowMs(nowMs);
  const ids = locationIds ?? Array.from(cache.keys());
  const gages = ids
    .map((id) => {
      const c = cache.get(id);
      if (!c || readingsUpTo(c, cutoff).length === 0) {
        return null;
      }
      const rates = computeTrendRates(readingsUpTo(c, cutoff).slice(-3));
      const skeleton = dashboardSkeletons.get(id) ?? { locationId: id, id };
      return {
        ...skeleton,
        locationId: id,
        readings: shiftedReadingObjects(c, cutoff, RECENT_WINDOW_MS),
        status: statusBlock(c, cutoff),
        peakStatus: statusBlock(c, cutoff),
        predictedFeetPerHour: rates.feetPerHour,
        predictedCfsPerHour: rates.cfsPerHour,
      };
    })
    .filter((g) => g !== null);
  return { gages };
}

/** V2 forecast shape for api.getForecasts (ForecastStore). */
export function buildV2Forecasts(gageIds?: string[], nowMs: number = Date.now()) {
  const cutoff = effectiveMockNowMs(nowMs);
  const ids = gageIds ?? Array.from(cache.keys());
  const out: Record<string, any> = {};
  for (const id of ids) {
    const c = cache.get(id);
    if (!c) {
      continue;
    }
    const preds = predictionObjects(c, cutoff);
    out[id] = {
      forecastId: 1,
      forecastCreated: toGaugeLocalString(
        shiftToDisplay(anchor!, cutoff - (scenario?.forecastAgeHours ?? 0) * HOUR_MS),
        timezone
      ),
      noaaSiteId: "",
      timestamps: preds.map((p) => p.timestamp),
      waterHeights: preds.map((p) => p.waterHeight),
      discharges: preds.map((p) => p.waterDischarge),
      peaks: null,
    };
  }
  return out;
}

/** V2 recent-readings shape for api.getReadings (ForecastStore). */
export function buildV2Readings(gageIds?: string[], nowMs: number = Date.now()) {
  const cutoff = effectiveMockNowMs(nowMs);
  const ids = gageIds ?? Array.from(cache.keys());
  const readings: Record<string, any> = {};
  for (const id of ids) {
    const c = cache.get(id);
    if (!c) {
      continue;
    }
    const objs = shiftedReadingObjects(c, cutoff, RECENT_WINDOW_MS);
    const rates = computeTrendRates(readingsUpTo(c, cutoff).slice(-3));
    readings[id] = {
      readingIds: objs.map((_, i) => i),
      timestamps: objs.map((o) => o.timestamp),
      waterHeights: objs.map((o) => o.waterHeight),
      discharges: objs.map((o) => o.waterDischarge),
      trendCfsPerHour: rates.cfsPerHour,
      trendFeetPerHour: rates.feetPerHour,
    };
  }
  return { readings, maxReadingId: null };
}

/** Map a NOAA predictor site id to the floodzilla gauge id we cached. */
function locationForNoaaSite(noaaSiteId: string): string | null {
  const predictors = (constants as any).predictors ?? {};
  for (const key of Object.keys(predictors)) {
    if (predictors[key].noaaSiteId === noaaSiteId) {
      return predictors[key].floodzillaId as string;
    }
  }
  return null;
}

/** Flood-probability bands for a predictor site (consumed via mockForecasts seam). */
export function buildMapQuantiles(
  noaaSiteId: string,
  nowMs: number = Date.now()
): MapQuantiles | null {
  const locationId = locationForNoaaSite(noaaSiteId);
  if (!locationId) {
    return null;
  }
  const c = cache.get(locationId);
  if (!c) {
    return null;
  }
  return synthesizeBands({
    actual: c.readings,
    fromMs: effectiveMockNowMs(nowMs),
    deviationPct: scenario?.forecastDeviationPct ?? 0,
  });
}
