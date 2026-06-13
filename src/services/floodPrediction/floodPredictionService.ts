import Config from "@config/config";
import constants from "@config/floodPredictionConstants.json";

import { computeFloodProbability, parseMapQuantiles, parseRatingTable } from "./calculations";
import { getDirectGaugeConstants } from "./directGauges";
import { getMockMapQuantiles } from "./mockForecasts";
import { FloodPredictionGauge, FloodProbabilityResult, MapQuantiles, RatingPoint } from "./types";

const gauges = (constants as { gauges: FloodPredictionGauge[] }).gauges;

// Rating tables rarely change → cached for the whole session.
const ratingCache = new Map<string, Promise<RatingPoint[]>>();
// Map-quantiles change daily (or faster during flooding) → 15-min TTL.
const quantileCache = new Map<string, { at: number; promise: Promise<MapQuantiles> }>();

/** Test hook: clears the in-memory caches. */
export function __resetFloodPredictionCaches() {
  ratingCache.clear();
  quantileCache.clear();
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
  // Debug-flag mock injection (out-of-season UX verification). Bypasses the
  // network and the cache so toggling the flag takes effect immediately and the
  // real quantile cache is never poisoned.
  const mock = getMockMapQuantiles(noaaSiteId);
  if (mock) {
    return Promise.resolve(mock);
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
 *  - SVPA gauge (in the generated constants): translate its red stage into a
 *    predictor stage via regression and read the predictor's exceedance curve at
 *    p99.
 *  - Direct USGS gauge (in the hand-maintained registry): the gauge is its own
 *    predictor — read its own exceedance curve at its own `redStage` (passed in,
 *    since it comes from locationInfo, not the constants). Forecast-only.
 *
 * Returns null when the gauge is covered by neither, or a direct gauge has no
 * red stage.
 */
export async function getFloodProbability(
  locationId: string,
  redStage?: number
): Promise<FloodProbabilityResult | null> {
  const gauge = gauges.find((g) => g.gaugeId === locationId);
  if (gauge) {
    const [ratingTable, quantiles] = await Promise.all([
      fetchRatingTable(gauge.predictor.usgsSiteId),
      fetchMapQuantiles(gauge.predictor.noaaSiteId),
    ]);

    return computeFloodProbability({
      p99: gauge.floodProbability.p99,
      quantiles,
      ratingTable,
    });
  }

  const direct = getDirectGaugeConstants(locationId);
  if (direct) {
    if (redStage == null) {
      return null;
    }
    const [ratingTable, quantiles] = await Promise.all([
      fetchRatingTable(direct.usgsSiteId),
      fetchMapQuantiles(direct.noaaSiteId),
    ]);

    // The gauge is its own predictor: its red stage is the threshold stage fed
    // straight into the exceedance curve (no regression p99 indirection).
    return computeFloodProbability({ p99: redStage, quantiles, ratingTable });
  }

  return null;
}
