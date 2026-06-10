import { FloodProbabilityResult, FloodWindow, MapQuantiles, RatingPoint } from "./types";

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
 * its window. On an exact tie the shorter (5-day) window wins. `isLow` is true
 * when both windows fall below the 0.1 exceedance.
 */
export function computeFloodProbability(args: {
  p99: number;
  quantiles: MapQuantiles;
  ratingTable: RatingPoint[];
}): FloodProbabilityResult {
  const { p99, quantiles, ratingTable } = args;
  const windows: FloodWindow[] = [5, 10];

  let best: { windowDays: FloodWindow; probability: number | null } = {
    windowDays: 5,
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
