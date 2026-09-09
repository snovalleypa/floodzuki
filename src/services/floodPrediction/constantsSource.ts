import { observable, runInAction } from "mobx";

import Config from "@config/config";
import * as storage from "@utils/storage";

import { FloodPredictionGauge, FloodPredictionPredictor } from "./types";

/**
 * The regression-derived flood-prediction constants, published per region by the
 * analytics pipeline (see the file's own `source` field) to
 * `floodzilla.com/files/prediction/`. The app bundles no copy: it loads the last
 * known-good copy from AsyncStorage, then refreshes from the network. This runs
 * on every `RootStore.fetchMainData` call — app launch, and again on login/logout
 * — not just once per session; repeat calls are safe (the box-empty guard means a
 * stale cached copy can never clobber constants that already published).
 *
 * The data lives in a module-level mobx box rather than in MST, matching the
 * decision documented in floodPredictionService.ts — these payloads must never
 * enter the persisted MST snapshot. Consumers read it through the synchronous
 * accessors below during render; because they render inside mobx `observer`
 * components, the box read makes them re-render when a load lands.
 */
export interface FloodPredictionConstants {
  schemaVersion: number;
  gauges: FloodPredictionGauge[];
  predictors: Record<string, FloodPredictionPredictor>;
}

const STORAGE_KEY = "flood-prediction-constants-v1";
const SCHEMA_VERSION = 1;

const box = observable.box<FloodPredictionConstants | null>(null, { deep: false });

function baseUrl(): string {
  const base = Config.FLOOD_PREDICTION_CONSTANTS_BASE_URL;
  return base.endsWith("/") ? base : base + "/";
}

/** URL of the per-region constants file, e.g. ".../flood-prediction-constants-region-1.json". */
export function getConstantsUrl(regionId: number): string {
  return `${baseUrl()}flood-prediction-constants-region-${regionId}.json`;
}

/**
 * The covered gauges, or `[]` until a load lands. Call this inside the consuming
 * function — never hoist it to a module-level const, which would both freeze the
 * empty pre-fetch value and skip the observable read that drives re-renders.
 */
export function getGauges(): FloodPredictionGauge[] {
  return box.get()?.gauges ?? [];
}

/** The predictor registry keyed by USGS site id, or `{}` until a load lands. */
export function getPredictors(): Record<string, FloodPredictionPredictor> {
  return box.get()?.predictors ?? {};
}

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const isStr = (v: unknown): v is string => typeof v === "string" && v.length > 0;

/**
 * A gauge entry, or null when it is missing anything the math depends on. Every
 * field checked here is read downstream: the regression coefficients and
 * p50/p90/p99 feed calculations.ts, and the predictor site ids address the USGS
 * rating table and the NOAA HEFS quantiles. A partial entry would produce NaN
 * probabilities rather than an absent row, so it is dropped instead.
 */
function parseGauge(raw: unknown): FloodPredictionGauge | null {
  const g = raw as Record<string, any>;
  if (!isStr(g?.gaugeId)) {
    return null;
  }
  // slope feeds a division in predictorStageForThreshold (calculations.ts): a
  // zero or negative slope sends the shifted p50/p90/p99 to +/-Infinity, which
  // ultimately renders as a literal "NaN%".
  if (!isNum(g.regression?.slope) || g.regression.slope <= 0 || !isNum(g.regression?.intercept)) {
    return null;
  }
  const fp = g.floodProbability;
  if (
    !isNum(fp?.redStage) ||
    !isNum(fp?.residualSigma) ||
    fp.residualSigma <= 0 ||
    !isNum(fp?.p50) ||
    !isNum(fp?.p90) ||
    !isNum(fp?.p99)
  ) {
    return null;
  }
  // derivePredictorStageProbability divides by (p90 - p50) and (p99 - p90); a
  // non-monotonic or degenerate spread (e.g. p50 === p90) collapses that span to
  // zero and yields a flat, false-dangerous 90% for any stage below p90.
  if (!(fp.p50 < fp.p90 && fp.p90 < fp.p99)) {
    return null;
  }
  if (!isStr(g.predictor?.usgsSiteId) || !isStr(g.predictor?.noaaSiteId)) {
    return null;
  }
  return g as FloodPredictionGauge;
}

/**
 * Validate an untrusted payload (remote file or cached copy). Returns null when
 * it is unusable, so a bad publish costs the caller the new data rather than the
 * data it already had.
 */
export function parseConstants(raw: unknown): FloodPredictionConstants | null {
  const data = raw as Record<string, any> | null;
  if (!data || typeof data !== "object") {
    return null;
  }
  if (data.schemaVersion !== SCHEMA_VERSION) {
    return null;
  }
  if (!Array.isArray(data.gauges)) {
    return null;
  }

  const gauges = data.gauges.map(parseGauge).filter((g): g is FloodPredictionGauge => g !== null);
  if (gauges.length === 0) {
    return null;
  }

  const predictors: Record<string, FloodPredictionPredictor> = {};
  const rawPredictors = data.predictors;
  if (rawPredictors && typeof rawPredictors === "object" && !Array.isArray(rawPredictors)) {
    for (const key of Object.keys(rawPredictors)) {
      const p = rawPredictors[key];
      if (isStr(p?.floodzillaId) && isStr(p?.noaaSiteId)) {
        predictors[key] = p as FloodPredictionPredictor;
      }
    }
  }

  return { schemaVersion: SCHEMA_VERSION, gauges, predictors };
}

function publish(c: FloodPredictionConstants | null) {
  runInAction(() => box.set(c));
}

/**
 * Load the constants for a region: cached copy first (so an offline launch
 * renders immediately), then a network refresh. Never rejects, and never leaves
 * the box worse off than it found it — any failure keeps the last-good copy.
 */
export async function loadFloodPredictionConstants(regionId: number): Promise<void> {
  // 1. Cached copy. Publish only if nothing has landed yet: on a second load the
  // cache is the older copy and must not overwrite what is already published.
  try {
    const cached = parseConstants(await storage.load(STORAGE_KEY));
    if (cached && box.get() === null) {
      publish(cached);
    }
  } catch {
    // A missing or unreadable cache is normal; fall through to the network.
  }

  // 2. Network refresh. `no-cache` forces revalidation against the origin's
  // ETag/Last-Modified (a cheap 304 when unchanged) instead of letting the
  // browser's heuristic freshness (no Cache-Control header on this origin, so
  // ~10% of age — currently 4+ days) serve a stale copy for days after a
  // mid-season republish.
  try {
    const res = await fetch(getConstantsUrl(regionId), { cache: "no-cache" });
    if (!res.ok) {
      return;
    }
    const parsed = parseConstants(await res.json());
    if (!parsed) {
      return;
    }
    publish(parsed);
    await storage.save(STORAGE_KEY, parsed);
  } catch {
    // Offline or unparseable: keep whatever is already published.
  }
}

/** Test hook: publish a raw payload (validated on the way in). */
export function __setConstantsForTest(raw: unknown) {
  publish(parseConstants(raw));
}

/** Test hook: empty the box. */
export function __resetConstantsForTest() {
  publish(null);
}
