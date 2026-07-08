// src/services/mockReplay/status.ts
import { ComputedStatus, RawReading } from "./types";

const DEAD_BAND_FT = 0.01;
const HOUR_MS = 3_600_000;

/** Least-squares slope of `values` against time (hours), over the last `n` points. */
function slopePerHour(points: { timestampMs: number; value?: number }[], n = 3): number {
  const usable = points.filter((p) => Number.isFinite(p.value)).slice(-n);
  if (usable.length < 2) {
    return 0;
  }
  const t0 = usable[0].timestampMs;
  const xs = usable.map((p) => (p.timestampMs - t0) / HOUR_MS);
  const ys = usable.map((p) => p.value as number);
  const meanX = xs.reduce((a, b) => a + b, 0) / xs.length;
  const meanY = ys.reduce((a, b) => a + b, 0) / ys.length;
  let num = 0;
  let den = 0;
  for (let i = 0; i < xs.length; i++) {
    num += (xs[i] - meanX) * (ys[i] - meanY);
    den += (xs[i] - meanX) ** 2;
  }
  return den === 0 ? 0 : num / den;
}

export function computeTrendRates(readings: RawReading[]): {
  feetPerHour: number;
  cfsPerHour: number;
} {
  return {
    feetPerHour: slopePerHour(
      readings.map((r) => ({ timestampMs: r.timestampMs, value: r.waterHeight }))
    ),
    cfsPerHour: slopePerHour(
      readings.map((r) => ({ timestampMs: r.timestampMs, value: r.waterDischarge }))
    ),
  };
}

export function computeStatus(args: {
  readings: RawReading[];
  yellowStage?: number;
  redStage?: number;
}): ComputedStatus {
  const { readings, yellowStage, redStage } = args;
  const ordered = [...readings].sort((a, b) => a.timestampMs - b.timestampMs);

  if (ordered.length === 0) {
    return {
      floodLevel: "Offline",
      levelTrend: "Offline",
      waterTrend: { trendValues: [], trendValue: 0 },
    };
  }

  const heights = ordered.map((r) => r.waterHeight).filter((h): h is number => Number.isFinite(h));
  const deltas: number[] = [];
  for (let i = 1; i < heights.length; i++) {
    deltas.push(heights[i] - heights[i - 1]);
  }
  const trendValues = deltas.slice(-4);
  const trendValue = deltas.length ? deltas[deltas.length - 1] : 0;

  let levelTrend = "Steady";
  if (trendValue > DEAD_BAND_FT) {
    levelTrend = "Rising";
  } else if (trendValue < -DEAD_BAND_FT) {
    levelTrend = "Falling";
  }

  const latest = heights[heights.length - 1];
  let floodLevel = "Normal";
  if (redStage != null && latest >= redStage) {
    floodLevel = "Flooding";
  } else if (yellowStage != null && latest >= yellowStage) {
    floodLevel = "NearFlooding";
  }

  return { floodLevel, levelTrend, waterTrend: { trendValues, trendValue } };
}
