// src/services/mockReplay/forecastSynthesis.ts
import { ForecastPoint, RatingCurve, RawReading } from "./types";

const HOUR_MS = 3_600_000;

/** Interpolate discharge at `atMs` over ascending readings; clamps at the ends. */
export function sampleDischargeAt(actual: RawReading[], atMs: number): number {
  const pts = actual.filter((r) => Number.isFinite(r.waterDischarge));
  if (pts.length === 0) {
    return 0;
  }
  if (atMs <= pts[0].timestampMs) {
    return pts[0].waterDischarge as number;
  }
  if (atMs >= pts[pts.length - 1].timestampMs) {
    return pts[pts.length - 1].waterDischarge as number;
  }
  for (let i = 0; i < pts.length - 1; i++) {
    if (atMs >= pts[i].timestampMs && atMs <= pts[i + 1].timestampMs) {
      const span = pts[i + 1].timestampMs - pts[i].timestampMs;
      const t = span === 0 ? 0 : (atMs - pts[i].timestampMs) / span;
      const a = pts[i].waterDischarge as number;
      const b = pts[i + 1].waterDischarge as number;
      return a + t * (b - a);
    }
  }
  return pts[pts.length - 1].waterDischarge as number;
}

export function synthesizeForecast(args: {
  actual: RawReading[];
  issuanceMs: number;
  deviationPct: number;
  rating: RatingCurve;
  horizonDays?: number;
  stepHours?: number;
}): ForecastPoint[] {
  const { actual, issuanceMs, deviationPct, rating } = args;
  const horizonDays = args.horizonDays ?? 10;
  const stepHours = args.stepHours ?? 6;
  const stepMs = stepHours * HOUR_MS;
  const steps = Math.round((horizonDays * 24) / stepHours); // 40 intervals
  const factor = 1 + deviationPct / 100;

  const sampled: number[] = [];
  for (let i = 0; i <= steps; i++) {
    sampled.push(sampleDischargeAt(actual, issuanceMs + i * stepMs));
  }

  const points: ForecastPoint[] = [];
  let discharge = sampled[0];
  for (let i = 0; i <= steps; i++) {
    if (i > 0) {
      discharge += (sampled[i] - sampled[i - 1]) * factor;
    }
    points.push({
      timestampMs: issuanceMs + i * stepMs,
      discharge,
      stage: rating.flowToHeight(discharge),
    });
  }
  return points;
}
