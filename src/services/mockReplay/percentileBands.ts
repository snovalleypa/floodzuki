// src/services/mockReplay/percentileBands.ts
import { MapQuantiles } from "@services/floodPrediction/types";
import { RawReading } from "./types";
import { sampleDischargeAt } from "./forecastSynthesis";

const DAY_MS = 86_400_000;

// NOAA HEFS map-quantile exceedance levels; the band shape must match what
// floodPredictionService expects from the real NOAA quantiles endpoint.
export const BAND_EXCEEDANCES = [0.1, 0.25, 0.3, 0.5, 0.7, 0.75, 0.9];
const BAND_SPREAD = [1.25, 1.12, 1.08, 1.0, 0.88, 0.85, 0.72];

function peakInWindow(actual: RawReading[], fromMs: number, days: number): number {
  const toMs = fromMs + days * DAY_MS;
  let peak = 0;
  for (const r of actual) {
    if (r.timestampMs >= fromMs && r.timestampMs <= toMs && Number.isFinite(r.waterDischarge)) {
      peak = Math.max(peak, r.waterDischarge as number);
    }
  }
  return peak;
}

export function synthesizeBands(args: {
  actual: RawReading[];
  fromMs: number;
  deviationPct: number;
}): MapQuantiles {
  const { actual, fromMs, deviationPct } = args;
  const factor = 1 + deviationPct / 100;
  const current = sampleDischargeAt(actual, fromMs);

  const flowsFor = (days: number): number[] => {
    const rawPeak = peakInWindow(actual, fromMs, days);
    const amplifiedPeak = current + (rawPeak - current) * factor;
    return BAND_SPREAD.map((m) => Math.round(amplifiedPeak * m));
  };

  return {
    exceedanceQuantiles: BAND_EXCEEDANCES,
    flowsByWindow: { 5: flowsFor(5), 10: flowsFor(10) },
  };
}
