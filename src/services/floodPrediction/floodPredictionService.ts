import Config from "@config/config";
import constants from "@config/floodPredictionConstants.json";

import { computeFloodProbability, parseMapQuantiles, parseRatingTable } from "./calculations";
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
 * Returns null when the gauge is not covered by the constants (R² < 0.9 or
 * otherwise excluded).
 */
export async function getFloodProbability(
  locationId: string
): Promise<FloodProbabilityResult | null> {
  const gauge = gauges.find((g) => g.gaugeId === locationId);
  if (!gauge) {
    return null;
  }

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
