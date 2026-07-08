// src/services/mockReplay/engine.ts
import localDayJs from "@services/localDayJs";
import constants from "@config/floodPredictionConstants.json";
import { DIRECT_GAUGES } from "@services/floodPrediction/directGauges";
import { MapQuantiles } from "@services/floodPrediction/types";

import { buildEmpiricalRating } from "./empiricalRating";
import { createAnchor, effectiveMockNow, shiftToDisplay, TimeAnchor } from "./timeShift";
import { isMockReplayActive } from "./mockReplayState";
import { toGaugeLocalString } from "./timestamps";
import { computeStatus, computeTrendRates } from "./status";
import { sampleDischargeAt, synthesizeForecast } from "./forecastSynthesis";
import { synthesizeBands } from "./percentileBands";
import { ForecastPoint, MockReplayScenario, RatingCurve, RawReading } from "./types";

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

  // Metagages (slash-joined ids, e.g. the "sum of the 3 forks") aren't understood
  // by the per-gauge reading endpoint — fetch their components and sum the flow.
  const metagageIds = ctx.forecastGageIds.filter((id) => id.includes("/"));
  const componentIds = metagageIds.flatMap((id) => id.split("/"));
  const directIds = Array.from(
    new Set([
      ...ctx.locationIds,
      ...ctx.forecastGageIds.filter((id) => !id.includes("/")),
      ...componentIds,
    ])
  );

  preloading = true;
  try {
    for (const id of directIds) {
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
    for (const metaId of metagageIds) {
      const parts = metaId
        .split("/")
        .map((cid) => cache.get(cid))
        .filter((c): c is GaugeCache => !!c);
      const readings = sumDischargeSeries(parts);
      // Metagage is flow-only (no stage), so the rating is unused → returns 0.
      cache.set(metaId, { readings, rating: { flowToHeight: () => 0 } });
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

// Synthesized values (interpolation, regression, extrapolation) carry many
// decimals; emit them at the precision the real API does — feet to 2 dp, flow to
// whole CFS — so the mock UI reads identically to live. Null/undefined pass
// through (the flow-only metagage has no stage).
function roundFeet<T extends number | null | undefined>(h: T): T {
  return (h == null ? h : Math.round((h as number) * 100) / 100) as T;
}
function roundFlow<T extends number | null | undefined>(d: T): T {
  return (d == null ? d : Math.round(d as number)) as T;
}

/** Sum component gauges' discharge onto a shared timestamp grid (for metagages). */
function sumDischargeSeries(caches: GaugeCache[]): RawReading[] {
  if (caches.length === 0) {
    return [];
  }
  const tset = new Set<number>();
  caches.forEach((c) => c.readings.forEach((r) => tset.add(r.timestampMs)));
  const grid = Array.from(tset).sort((a, b) => a - b);
  return grid.map((t) => ({
    timestampMs: t,
    waterDischarge: roundFlow(caches.reduce((sum, c) => sum + sampleDischargeAt(c.readings, t), 0)),
  }));
}

const STALE_AFTER_MS = 2 * HOUR_MS; // no reading within 2h → offline, no trend line

function readingsUpTo(c: GaugeCache, cutoffMs: number): RawReading[] {
  return c.readings.filter((r) => r.timestampMs <= cutoffMs);
}

/**
 * A gauge is stale when its most recent reading is 2h+ behind the mock "now".
 * Gauges lag at different rates; a stale one is treated as offline (no trend).
 */
function isStale(latest: RawReading | undefined, cutoffMs: number): boolean {
  return !latest || cutoffMs - latest.timestampMs >= STALE_AFTER_MS;
}

/** Trend rates from the last 3 readings, zeroed when the gauge is stale. */
function trendRatesAt(c: GaugeCache, cutoffMs: number) {
  const upTo = readingsUpTo(c, cutoffMs);
  if (isStale(upTo[upTo.length - 1], cutoffMs)) {
    return { feetPerHour: 0, cfsPerHour: 0 };
  }
  return computeTrendRates(upTo.slice(-3));
}

/**
 * Shifted, gauge-local GageReading objects for [cutoff - window, cutoff], ordered
 * newest-first (descending) to match the real reading API — consumers assume
 * readings[0] is the latest (latestReading, maxReading, predictedPoints).
 */
function shiftedReadingObjects(c: GaugeCache, cutoffMs: number, windowMs: number) {
  const from = cutoffMs - windowMs;
  return c.readings
    .filter((r) => r.timestampMs >= from && r.timestampMs <= cutoffMs)
    .map((r) => ({
      timestamp: toGaugeLocalString(shiftToDisplay(anchor!, r.timestampMs), timezone),
      waterHeight: roundFeet(r.waterHeight),
      waterDischarge: roundFlow(r.waterDischarge),
      isDeleted: false,
      isMissing: false,
    }))
    .reverse();
}

function statusBlock(c: GaugeCache, cutoffMs: number) {
  const upTo = readingsUpTo(c, cutoffMs);
  const recent = upTo.slice(-12); // last ~12 readings drive trend
  const last = upTo[upTo.length - 1];
  // A gauge whose last reading is 2h+ stale is reported offline (but still
  // visible — it keeps its last known reading).
  const status = isStale(last, cutoffMs)
    ? {
        floodLevel: "Offline",
        levelTrend: "Offline",
        waterTrend: { trendValues: [], trendValue: 0 },
      }
    : computeStatus({
        readings: recent,
        yellowStage: c.yellowStage,
        redStage: c.redStage,
      });
  const lastReading = last
    ? {
        timestamp: toGaugeLocalString(shiftToDisplay(anchor!, last.timestampMs), timezone),
        waterHeight: roundFeet(last.waterHeight),
        waterDischarge: roundFlow(last.waterDischarge),
        isDeleted: false,
      }
    : undefined;
  return { ...status, lastReading };
}

/** Raw (epoch-ms) synthesized forecast series for a gauge, issued at now - age. */
function forecastSeries(c: GaugeCache, cutoffMs: number): ForecastPoint[] {
  if (!scenario) {
    return [];
  }
  const issuanceMs = cutoffMs - scenario.forecastAgeHours * HOUR_MS;
  return synthesizeForecast({
    actual: c.readings,
    issuanceMs,
    deviationPct: scenario.forecastDeviationPct,
    rating: c.rating,
  });
}

function toPredictionObject(p: ForecastPoint) {
  return {
    timestamp: toGaugeLocalString(shiftToDisplay(anchor!, p.timestampMs), timezone),
    waterHeight: roundFeet(p.stage),
    waterDischarge: roundFlow(p.discharge),
    isDeleted: false,
  };
}

function predictionObjects(c: GaugeCache, cutoffMs: number) {
  return forecastSeries(c, cutoffMs).map(toPredictionObject);
}

const NOWCAST_STEP_MIN = 15;
const NOWCAST_WINDOW_MIN = 6 * 60;
const MIN_MS = 60_000;

/**
 * The short-term trend nowcast returned by getGageReadings as `predictions`:
 * the current rate of change extrapolated linearly for 6 hours at 15-minute
 * steps. Exists for every gauge (level and/or flow). Excludes the anchor
 * point — Gage.predictedPoints prepends readings[0].
 *
 * Anchored to each gauge's OWN last reading (gauges lag at different rates), so
 * the first point is 15 min after that reading, not after mockNow. A gauge with
 * no reading in the last 2h is stale (offline) → no trend line.
 */
function trendNowcast(c: GaugeCache, cutoffMs: number) {
  const upTo = readingsUpTo(c, cutoffMs);
  const latest = upTo[upTo.length - 1];
  if (isStale(latest, cutoffMs)) {
    return [];
  }
  const rates = computeTrendRates(upTo.slice(-3));
  const out = [];
  for (let m = NOWCAST_STEP_MIN; m <= NOWCAST_WINDOW_MIN; m += NOWCAST_STEP_MIN) {
    const hours = m / 60;
    const tMs = latest!.timestampMs + m * MIN_MS;
    out.push({
      timestamp: toGaugeLocalString(shiftToDisplay(anchor!, tMs), timezone),
      waterHeight:
        latest!.waterHeight != null
          ? roundFeet(latest!.waterHeight + rates.feetPerHour * hours)
          : undefined,
      waterDischarge:
        latest!.waterDischarge != null
          ? roundFlow(latest!.waterDischarge + rates.cfsPerHour * hours)
          : undefined,
      isDeleted: false,
    });
  }
  return out;
}

/** The upcoming forecast crest (max discharge at/after the cutoff), shifted. */
function forecastPeak(c: GaugeCache, cutoffMs: number) {
  const future = forecastSeries(c, cutoffMs).filter((p) => p.timestampMs >= cutoffMs);
  if (future.length === 0) {
    return null;
  }
  const peak = future.reduce((mx, p) => (p.discharge > mx.discharge ? p : mx), future[0]);
  return {
    timestamps: [toGaugeLocalString(shiftToDisplay(anchor!, peak.timestampMs), timezone)],
    discharges: [roundFlow(peak.discharge)],
    waterHeights: [roundFeet(peak.stage)],
  };
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
  const rates = trendRatesAt(c, cutoff);
  return {
    ...empty,
    noData: false,
    readings: shiftedReadingObjects(c, cutoff, RECENT_WINDOW_MS),
    status: statusBlock(c, cutoff),
    peakStatus: statusBlock(c, cutoff),
    predictedFeetPerHour: rates.feetPerHour,
    predictedCfsPerHour: rates.cfsPerHour,
    predictions: trendNowcast(c, cutoff),
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
      const rates = trendRatesAt(c, cutoff);
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
      peaks: forecastPeak(c, cutoff),
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
      // V2 ReadingModel.waterHeights is a strict number[]; the flow-only metagage
      // has no stage → coerce to 0. discharges is maybeNull → coerce to null.
      waterHeights: objs.map((o) => o.waterHeight ?? 0),
      discharges: objs.map((o) => o.waterDischarge ?? null),
      trendCfsPerHour: rates.cfsPerHour,
      trendFeetPerHour: rates.feetPerHour,
    };
  }
  return { readings, maxReadingId: null };
}

/**
 * Map a NOAA site id to the floodzilla gauge id we cached. Covers the direct USGS
 * gauges (Falls, Carnation, Monroe, the three forks) so their HEFS bands are
 * mocked too — each is preloaded in the cache (forecast gauge or metagage
 * component). Falls back to the generated predictors block for any predictor not
 * in the registry.
 */
function locationForNoaaSite(noaaSiteId: string): string | null {
  const direct = DIRECT_GAUGES.find((g) => g.noaaSiteId === noaaSiteId);
  if (direct) {
    return direct.gaugeId;
  }
  const predictors = (constants as any).predictors ?? {};
  for (const key of Object.keys(predictors)) {
    if (predictors[key].noaaSiteId === noaaSiteId) {
      return predictors[key].floodzillaId as string;
    }
  }
  return null;
}

/** Flood-probability bands for a predictor site (consumed by floodPredictionService). */
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
