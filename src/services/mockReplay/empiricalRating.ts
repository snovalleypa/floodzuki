// src/services/mockReplay/empiricalRating.ts
import { RatingCurve, RawReading } from "./types";

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
      const span = xs[i + 1] - xs[i];
      if (span === 0) {
        return ys[i];
      }
      const t = (x - xs[i]) / span;
      return ys[i] + t * (ys[i + 1] - ys[i]);
    }
  }
  return ys[ys.length - 1];
}

/** Build a clamped piecewise-linear CFS->ft curve from a gauge's readings. */
export function buildEmpiricalRating(readings: RawReading[]): RatingCurve {
  const byDischarge = new Map<number, number>();
  for (const reading of readings) {
    const q = reading.waterDischarge;
    const h = reading.waterHeight;
    if (!Number.isFinite(q) || !Number.isFinite(h)) {
      continue;
    }
    // Last write wins for a duplicate discharge; pairs are near-identical anyway.
    byDischarge.set(q as number, h as number);
  }
  const sorted = [...byDischarge.entries()].sort((a, b) => a[0] - b[0]);
  const xs = sorted.map(([q]) => q);
  const ys = sorted.map(([, h]) => h);
  return { flowToHeight: (cfs: number) => interpolateClamped(xs, ys, cfs) };
}
