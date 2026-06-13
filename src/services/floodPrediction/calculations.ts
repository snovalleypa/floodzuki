import {
  FloodChanceLevel,
  FloodChanceResult,
  FloodProbabilityResult,
  FloodRiskLevel,
  FloodWindow,
  MapQuantiles,
  RatingPoint,
} from "./types";

/**
 * Parse a USGS "exsa" (expanded, shifted, ascending) rating table into sorted
 * (gageHeight, discharge) points. The shift is already baked into the DEP
 * column, so observed gage height = INDEP, discharge = DEP. Comment (`#`),
 * header, and format rows are skipped; trailing `*` markers are ignored.
 */
export function parseRatingTable(text: string): RatingPoint[] {
  const points: RatingPoint[] = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.startsWith("#")) {
      continue;
    }
    const cols = line.split("\t");
    const gageHeight = Number(cols[0]);
    const discharge = Number(cols[2]);
    if (!Number.isFinite(gageHeight) || !Number.isFinite(discharge)) {
      continue;
    }
    points.push({ gageHeight, discharge });
  }
  return points.sort((a, b) => a.discharge - b.discharge);
}

/**
 * Linear interpolation over a monotonically-increasing xs, clamped to the first
 * and last y at the ends (no extrapolation beyond observed data).
 */
function interpolateClamped(xs: number[], ys: number[], x: number): number {
  if (xs.length === 0) {
    return NaN;
  }
  if (x <= xs[0]) {
    return ys[0];
  }
  if (x >= xs[xs.length - 1]) {
    return ys[ys.length - 1];
  }
  for (let i = 0; i < xs.length - 1; i++) {
    if (x >= xs[i] && x <= xs[i + 1]) {
      const t = (x - xs[i]) / (xs[i + 1] - xs[i]);
      return ys[i] + t * (ys[i + 1] - ys[i]);
    }
  }
  return ys[ys.length - 1];
}

/** Invert the rating table: discharge (CFS) -> gage height (ft), clamped. */
export function flowToHeight(table: RatingPoint[], cfs: number): number {
  return interpolateClamped(
    table.map((p) => p.discharge),
    table.map((p) => p.gageHeight),
    cfs
  );
}

/** Normalize a raw NOAA HEFS map-quantiles payload. */
export function parseMapQuantiles(raw: any): MapQuantiles {
  const exceedanceQuantiles: number[] = raw?.metadata?.exceedance_quantiles ?? [];
  const flowsByWindow: Record<number, number[]> = {};
  for (const vs of raw?.value_set ?? []) {
    flowsByWindow[vs.forecast_length] = vs.quantile_values;
  }
  return { exceedanceQuantiles, flowsByWindow };
}

export interface ExceedancePoint {
  exceedance: number;
  height: number;
}

/**
 * Convert the forecast flow quantiles for one window into (exceedance, height)
 * points. Ordered by ascending exceedance, which is descending height.
 */
export function buildExceedanceHeightCurve(
  q: MapQuantiles,
  table: RatingPoint[],
  windowDays: FloodWindow
): ExceedancePoint[] {
  const flows = q.flowsByWindow[windowDays];
  if (!flows) {
    return [];
  }
  return q.exceedanceQuantiles.map((exceedance, i) => ({
    exceedance,
    height: flowToHeight(table, flows[i]),
  }));
}

/**
 * Return the exceedance probability that the predictor gauge reaches `height`,
 * by interpolating between the curve's known (exceedance, height) points.
 * Returns null when `height` is above the least-likely (0.1) exceedance height;
 * clamps to the highest available exceedance below the lowest height.
 */
export function heightToProbability(curve: ExceedancePoint[], height: number): number | null {
  if (curve.length === 0) {
    return null;
  }
  const top = curve[0]; // lowest exceedance (0.1), highest height
  const bottom = curve[curve.length - 1]; // highest exceedance (0.9), lowest height
  if (height > top.height) {
    return null;
  }
  if (height <= bottom.height) {
    return bottom.exceedance;
  }
  for (let i = 0; i < curve.length - 1; i++) {
    const hi = curve[i]; // higher height, lower exceedance
    const lo = curve[i + 1]; // lower height, higher exceedance
    if (height <= hi.height && height >= lo.height) {
      const t = (hi.height - height) / (hi.height - lo.height);
      return hi.exceedance + t * (lo.exceedance - hi.exceedance);
    }
  }
  return bottom.exceedance;
}

/**
 * Compute the flood probability for a gauge: feed its p99 predictor stage into
 * the 5- and 10-day exceedance curves and report the greater probability with
 * its window. On an exact non-null tie the shorter (5-day) window wins; when
 * both windows are null the result is low and reported against the 10-day
 * window. `isLow` is true when both windows fall below the 0.1 exceedance.
 */
export function computeFloodProbability(args: {
  p99: number;
  quantiles: MapQuantiles;
  ratingTable: RatingPoint[];
}): FloodProbabilityResult {
  const { p99, quantiles, ratingTable } = args;
  const windows: FloodWindow[] = [5, 10];

  // Fallback window is 10-day: it survives only when both windows are null
  // (the low case). Windows are iterated 5 then 10 with a strict comparison, so
  // a non-null tie keeps the earlier (5-day) window.
  let best: { windowDays: FloodWindow; probability: number | null } = {
    windowDays: 10,
    probability: null,
  };

  for (const windowDays of windows) {
    const curve = buildExceedanceHeightCurve(quantiles, ratingTable, windowDays);
    const probability = heightToProbability(curve, p99);
    // Prefer a strictly greater probability; null counts as "below 10%" (-1).
    if ((probability ?? -1) > (best.probability ?? -1)) {
      best = { windowDays, probability };
    }
  }

  return {
    probability: best.probability,
    windowDays: best.windowDays,
    isLow: best.probability === null,
  };
}

/**
 * Observed/nowcast probability: translate a measured predictor stage directly
 * into P(flood) using the gauge's p50/p90/p99 constants. p50 bisects the
 * near-linear p10↔p90 segment, so P10 stage = 2·p50 − p90. The mapping is
 * piecewise linear: (p10,0.10)→(p90,0.90) below p90, (p90,0.90)→(p99,0.99) at or
 * above p90 (extended past p99, so stage > p99 yields > 0.99). Can return values
 * below 0.10 or above 0.99; callers bucket/round at display.
 */
export function derivePredictorStageProbability(
  fp: { p50: number; p90: number; p99: number },
  stage: number
): number {
  if (stage >= fp.p90) {
    const span = fp.p99 - fp.p90;
    if (span === 0) {
      return 0.9;
    }
    return 0.9 + ((stage - fp.p90) / span) * 0.09;
  }
  const p10Stage = 2 * fp.p50 - fp.p90;
  const span = fp.p90 - p10Stage;
  if (span === 0) {
    return 0.9;
  }
  return 0.1 + ((stage - p10Stage) / span) * 0.8;
}

function roundToFivePercent(probability: number): number {
  return Math.round((probability * 100) / 5) * 5;
}

/**
 * Combine the forecast and observed probabilities into a display bucket, taking
 * the greater of the two (observed must be strictly greater to win — the
 * forecast holds ties). The forecast is clamped at 90% so it can only reach the
 * "veryHighClamp" (>90%) bucket; the precise observed path reaches the exact
 * "veryHigh" and "nearCertain" (>=99%) buckets. Returns null only when neither a
 * forecast nor an observed value is available.
 */
export function combineFloodChance(args: {
  forecast: FloodProbabilityResult | null;
  observedProbability: number | null;
}): FloodChanceResult | null {
  const { forecast, observedProbability } = args;
  const windowDays: FloodWindow = forecast?.windowDays ?? 5;

  const forecastProb = forecast?.probability ?? null;
  const fVal = forecastProb ?? -Infinity;
  const oVal = observedProbability ?? -Infinity;

  if (fVal === -Infinity && oVal === -Infinity) {
    // No numeric probability. A present-but-low forecast still reports "low";
    // a missing forecast with no observed value reports nothing.
    return forecast ? { windowDays, chance: { level: "low" } } : null;
  }

  const source: "forecast" | "observed" = oVal > fVal ? "observed" : "forecast";
  const pct = roundToFivePercent(Math.max(fVal, oVal));

  let chance: FloodChanceLevel;
  if (pct < 10) {
    chance = { level: "low" };
  } else if (pct >= 100) {
    chance = { level: "nearCertain" };
  } else if (pct >= 90) {
    chance =
      source === "observed" ? { level: "veryHigh", percent: pct } : { level: "veryHighClamp" };
  } else {
    chance = { level: "percent", percent: pct };
  }

  return { windowDays, chance };
}

/**
 * Group a flood-chance bucket into a coarse risk level for badge selection:
 * High (>=70%), Medium (>30% and <70%), Low (<=30%). The clamped/precise
 * very-high buckets are all >=90% → High; the `low` bucket (<10%) → Low.
 * Percentages out of `combineFloodChance` are multiples of 5, so the 30/35 and
 * 65/70 boundaries fall cleanly between buckets.
 */
export function floodChanceRiskLevel(chance: FloodChanceLevel): FloodRiskLevel {
  switch (chance.level) {
    case "low":
      return FloodRiskLevel.Low;
    case "veryHighClamp":
    case "veryHigh":
    case "nearCertain":
      return FloodRiskLevel.High;
    case "percent":
      if (chance.percent >= 70) {
        return FloodRiskLevel.High;
      }
      if (chance.percent > 30) {
        return FloodRiskLevel.Medium;
      }
      return FloodRiskLevel.Low;
  }
}
