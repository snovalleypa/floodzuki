// src/services/mockReplay/types.ts

/** A single historical reading, normalized to epoch-ms for math. */
export interface RawReading {
  timestampMs: number;
  waterHeight?: number;
  waterDischarge?: number;
  isDeleted?: boolean;
}

/** Inverts discharge (CFS) -> gage height (ft) for one gauge. */
export interface RatingCurve {
  flowToHeight(cfs: number): number;
}

/** Computed gauge status, mirroring the backend GageStatus shape. */
export interface ComputedStatus {
  floodLevel: string;
  levelTrend: string;
  waterTrend: { trendValues: number[]; trendValue: number };
}

/** One synthesized forecast point. */
export interface ForecastPoint {
  timestampMs: number;
  discharge: number;
  stage: number;
}

export interface MockReplayScenario {
  id: string;
  label: string;
  /** "YYYY-MM-DDTHH:mm:ss", interpreted in the gauge timezone. */
  mockNow: string;
  forecastAgeHours: number;
  /** 0 = forecast matches actual; 10 = each step's change is +10%. */
  forecastDeviationPct: number;
}
