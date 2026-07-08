import { observable, runInAction } from "mobx";

import Config from "@config/config";
import constants from "@config/floodPredictionConstants.json";

import * as mockReplayEngine from "@services/mockReplay/engine";

import {
  computeFloodProbability,
  parseMapQuantiles,
  parseRatingTable,
  predictorStageForThreshold,
} from "./calculations";
import { getDirectGaugeConstants } from "./directGauges";
import { FloodPredictionGauge, FloodProbabilityResult, MapQuantiles, RatingPoint } from "./types";

const gauges = (constants as { gauges: FloodPredictionGauge[] }).gauges;

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

/** Test hook: clears the in-memory caches. */
export function __resetFloodPredictionCaches() {
  ratingCache.clear();
  quantileCache.clear();
  runInAction(() => resultCache.clear());
}

/** The prediction constants for a gauge, or null when it isn't covered. */
export function getGaugeConstants(locationId?: string): FloodPredictionGauge | null {
  if (!locationId) {
    return null;
  }
  return gauges.find((g) => g.gaugeId === locationId) ?? null;
}

function fetchRatingTable(usgsSiteId: string): Promise<RatingPoint[]> {
  const cached = ratingCache.get(usgsSiteId);
  if (cached) {
    return cached;
  }
  const url = `${Config.USGS_RATING_TABLE_URL}?site_no=${usgsSiteId}&file_type=exsa`;
  const promise = fetch(url)
    .then((r) => r.text())
    .then(parseRatingTable)
    .catch((e) => {
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
    .then((r) => r.json())
    .then(parseMapQuantiles)
    .catch((e) => {
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
 *  - SVPA gauge (in the generated constants): translate the threshold height into
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
export async function getFloodProbability(
  locationId: string,
  thresholdOverride?: number
): Promise<FloodProbabilityResult | null> {
  const gauge = gauges.find((g) => g.gaugeId === locationId);
  if (gauge) {
    const [ratingTable, quantiles] = await Promise.all([
      fetchRatingTable(gauge.predictor.usgsSiteId),
      fetchMapQuantiles(gauge.predictor.noaaSiteId),
    ]);

    const predictorStage = predictorStageForThreshold(
      gauge.floodProbability,
      gauge.regression.slope,
      thresholdOverride
    );
    const result = computeFloodProbability({ p99: predictorStage, quantiles, ratingTable });
    runInAction(() => resultCache.set(resultKey(locationId, thresholdOverride), result));
    return result;
  }

  const direct = getDirectGaugeConstants(locationId);
  if (direct) {
    if (thresholdOverride == null) {
      return null;
    }
    const [ratingTable, quantiles] = await Promise.all([
      fetchRatingTable(direct.usgsSiteId),
      fetchMapQuantiles(direct.noaaSiteId),
    ]);

    // The gauge is its own predictor: the threshold stage is fed straight into the
    // exceedance curve (no regression p99 indirection).
    const result = computeFloodProbability({ p99: thresholdOverride, quantiles, ratingTable });
    runInAction(() => resultCache.set(resultKey(locationId, thresholdOverride), result));
    return result;
  }

  return null;
}
