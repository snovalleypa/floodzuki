import { observable, runInAction } from "mobx";

import Config from "@config/config";

import * as mockReplayEngine from "@services/mockReplay/engine";
import * as storage from "@utils/storage";

import {
  computeFloodProbability,
  parseMapQuantiles,
  parseRatingTable,
  predictorStageForThreshold,
} from "./calculations";
import { getGauges } from "./constantsSource";
import { getDirectGaugeConstants } from "./directGauges";
import { FloodPredictionGauge, FloodProbabilityResult, MapQuantiles, RatingPoint } from "./types";

// Rating tables rarely change → cached for the whole session.
const ratingCache = new Map<string, Promise<RatingPoint[]>>();
// Map-quantiles change daily (or faster during flooding) → 15-min TTL.
const quantileCache = new Map<string, { at: number; promise: Promise<MapQuantiles> }>();
// Last resolved probability per gauge+threshold, readable synchronously. An
// observable map (not a plain Map) on purpose: a consumer reads the value during
// render, and the async fetch writes it later. For a mobx `observer` (e.g. the
// gauge-list status pill) the observable read makes the component reliably
// re-render when the value lands — a plain Map + async setState was racy and got
// dropped for virtualized rows whose own re-render didn't fire. Kept out of MST
// (a module-level observable) so the bulky payloads never enter the snapshot.
const resultCache = observable.map<string, FloodProbabilityResult>({}, { deep: false });

// Gauge+threshold keys whose last computation failed (no rating table or
// quantiles from any source), so the UI can show "unavailable" instead of
// loading forever. Observable for the same reason as resultCache.
const failedKeys = observable.set<string>();

function resultKey(locationId: string, threshold?: number): string {
  return threshold == null ? locationId : `${locationId}:${threshold}`;
}

/** The last computed flood probability for a gauge, or undefined if none yet. */
export function getCachedFloodProbability(
  locationId?: string,
  threshold?: number
): FloodProbabilityResult | undefined {
  if (!locationId) {
    return undefined;
  }
  return resultCache.get(resultKey(locationId, threshold));
}

/**
 * True when the last attempt to compute this gauge+threshold failed and nothing
 * has succeeded since. Keyed exactly like getCachedFloodProbability.
 */
export function hasFloodProbabilityFailed(locationId?: string, threshold?: number): boolean {
  if (!locationId) {
    return false;
  }
  return failedKeys.has(resultKey(locationId, threshold));
}

/** Test hook: clears the in-memory caches. */
export function __resetFloodPredictionCaches() {
  ratingCache.clear();
  quantileCache.clear();
  runInAction(() => {
    resultCache.clear();
    failedKeys.clear();
  });
}

/** The prediction constants for a gauge, or null when it isn't covered. */
export function getGaugeConstants(locationId?: string): FloodPredictionGauge | null {
  if (!locationId) {
    return null;
  }
  // Read inside the function, not at module scope: the constants arrive
  // asynchronously, and this observable read is what re-renders the mobx
  // `observer` consumers when they land.
  return getGauges().find((g) => g.gaugeId === locationId) ?? null;
}

// Last known-good raw rating table per USGS site, so a launch while every source
// is down still computes. Not `store-`-prefixed: it must survive the cache-bucket
// cleanup on upgrade (same as the flood-prediction constants).
const RATING_STORAGE_KEY_PREFIX = "flood-prediction-rating-v1-";

/**
 * Rating-table sources, tried in order. The floodzilla.com mirror comes first:
 * USGS fronts `get_ratings` with an AWS WAF bot challenge (an empty 202 with
 * `x-amzn-waf-action: challenge`, or a 403) that an app `fetch()` can't pass. The
 * mirror serves the same USGS "exsa" text, so one parser handles both.
 */
function ratingTableUrls(usgsSiteId: string): string[] {
  const mirror = Config.RATING_TABLE_MIRROR_BASE_URL;
  return [
    `${mirror.endsWith("/") ? mirror : mirror + "/"}${usgsSiteId}.txt`,
    `${Config.USGS_RATING_TABLE_URL}?site_no=${usgsSiteId}&file_type=exsa`,
  ];
}

/**
 * Parse raw rating text, rejecting a table too small to interpolate. An empty
 * table (an error or challenge page served as 2xx) would make every flow→height
 * lookup NaN, which reads as the 0.9 clamp — a false ">90%".
 */
function parseValidRatingTable(text: string | null): RatingPoint[] | null {
  if (!text) {
    return null;
  }
  const table = parseRatingTable(text);
  return table.length >= 2 ? table : null;
}

async function fetchRatingText(url: string): Promise<string> {
  const r = await fetch(url);
  if (!r.ok) {
    throw new Error(`rating table ${url}: HTTP ${r.status}`);
  }
  return r.text();
}

async function loadRatingTable(usgsSiteId: string): Promise<RatingPoint[]> {
  const storageKey = RATING_STORAGE_KEY_PREFIX + usgsSiteId;
  for (const url of ratingTableUrls(usgsSiteId)) {
    try {
      const text = await fetchRatingText(url);
      const table = parseValidRatingTable(text);
      if (table) {
        void storage.saveString(storageKey, text);
        return table;
      }
    } catch {
      // Unreachable or blocked: try the next source.
    }
  }
  const stored = parseValidRatingTable(await storage.loadString(storageKey));
  if (stored) {
    return stored;
  }
  throw new Error(`rating table ${usgsSiteId}: no source available`);
}

function fetchRatingTable(usgsSiteId: string): Promise<RatingPoint[]> {
  const cached = ratingCache.get(usgsSiteId);
  if (cached) {
    return cached;
  }
  const promise = loadRatingTable(usgsSiteId).catch((e) => {
    // Drop the failed promise so a later call can retry.
    ratingCache.delete(usgsSiteId);
    throw e;
  });
  ratingCache.set(usgsSiteId, promise);
  return promise;
}

function fetchMapQuantiles(noaaSiteId: string): Promise<MapQuantiles> {
  // Flood replay mock injection (out-of-season UX verification). Bypasses the
  // network and the cache so the scenario's bands take effect immediately and
  // the real quantile cache is never poisoned.
  if (mockReplayEngine.isActive()) {
    const mock = mockReplayEngine.buildMapQuantiles(noaaSiteId);
    if (mock) {
      return Promise.resolve(mock);
    }
  }

  const entry = quantileCache.get(noaaSiteId);
  if (entry && Date.now() - entry.at < Config.MAP_QUANTILES_CACHE_TTL) {
    return entry.promise;
  }
  const url = `${Config.NOAA_MAP_QUANTILES_URL}?location_id=${noaaSiteId}&parameter_id=QINE`;
  const promise = fetch(url)
    .then((r) => {
      if (!r.ok) {
        throw new Error(`NOAA map-quantiles ${noaaSiteId}: HTTP ${r.status}`);
      }
      return r.json();
    })
    .then((raw) => {
      const quantiles = parseMapQuantiles(raw);
      if (!quantiles) {
        throw new Error(`NOAA map-quantiles ${noaaSiteId}: not a usable forecast`);
      }
      return quantiles;
    })
    .catch((e) => {
      // Drop the failed promise so a later call can retry.
      quantileCache.delete(noaaSiteId);
      throw e;
    });
  quantileCache.set(noaaSiteId, { at: Date.now(), promise });
  return promise;
}

/**
 * Backend seam: estimate the flood probability for a gauge. When the inputs
 * move server-side, replace the body of this function with a single API call
 * that returns a FloodProbabilityResult — the hook and UI are unaffected.
 *
 * Two paths:
 *  - SVPA gauge (in the remotely-published constants): translate the threshold height into
 *    a predictor stage via the regression-anchored shift and read the predictor's
 *    exceedance curve there. With no `thresholdOverride` this is the gauge's red
 *    stage (predictor stage = p99); a road saddle shifts it up by
 *    Δ = (threshold − redStage) / slope.
 *  - Direct USGS gauge (in the hand-maintained registry): the gauge is its own
 *    predictor — read its own exceedance curve at `thresholdOverride` (its red
 *    stage or road saddle, passed in since it comes from locationInfo, not the
 *    constants). Forecast-only.
 *
 * Returns null when the gauge is covered by neither, or a direct gauge has no
 * threshold.
 */
/** Fetch both inputs, marking `key` failed if either has no usable source. */
async function fetchInputs(
  key: string,
  usgsSiteId: string,
  noaaSiteId: string
): Promise<[RatingPoint[], MapQuantiles]> {
  try {
    return await Promise.all([fetchRatingTable(usgsSiteId), fetchMapQuantiles(noaaSiteId)]);
  } catch (e) {
    runInAction(() => failedKeys.add(key));
    throw e;
  }
}

function recordResult(key: string, result: FloodProbabilityResult) {
  runInAction(() => {
    resultCache.set(key, result);
    failedKeys.delete(key);
  });
}

export async function getFloodProbability(
  locationId: string,
  thresholdOverride?: number
): Promise<FloodProbabilityResult | null> {
  const gauge = getGauges().find((g) => g.gaugeId === locationId);
  const key = resultKey(locationId, thresholdOverride);
  if (gauge) {
    const [ratingTable, quantiles] = await fetchInputs(
      key,
      gauge.predictor.usgsSiteId,
      gauge.predictor.noaaSiteId
    );

    const predictorStage = predictorStageForThreshold(
      gauge.floodProbability,
      gauge.regression.slope,
      thresholdOverride
    );
    const result = computeFloodProbability({ p99: predictorStage, quantiles, ratingTable });
    recordResult(key, result);
    return result;
  }

  const direct = getDirectGaugeConstants(locationId);
  if (direct) {
    if (thresholdOverride == null) {
      return null;
    }
    const [ratingTable, quantiles] = await fetchInputs(key, direct.usgsSiteId, direct.noaaSiteId);

    // The gauge is its own predictor: the threshold stage is fed straight into the
    // exceedance curve (no regression p99 indirection).
    const result = computeFloodProbability({ p99: thresholdOverride, quantiles, ratingTable });
    recordResult(key, result);
    return result;
  }

  return null;
}
