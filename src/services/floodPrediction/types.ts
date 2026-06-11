export interface FloodPredictionPredictor {
  floodzillaId: string;
  usgsSiteId: string;
  noaaSiteId: string;
  name: string;
}

export interface FloodPredictionGauge {
  gaugeId: string;
  name: string;
  redStage: number;
  predictor: FloodPredictionPredictor;
  regression: { slope: number; intercept: number };
  floodProbability: {
    redStage: number;
    residualSigma: number;
    p50: number;
    p90: number;
    p99: number;
  };
  validRange: { minPredictorStage: number; maxPredictorStage: number };
  fit: { r2: number; n: number };
}

/** A single (gage height, discharge) point from the USGS exsa rating table. */
export interface RatingPoint {
  gageHeight: number;
  discharge: number;
}

/** Parsed NOAA HEFS map-quantiles for one predictor site. */
export interface MapQuantiles {
  /** Exceedance probabilities, ascending, e.g. [0.1, 0.25, ... 0.9]. */
  exceedanceQuantiles: number[];
  /** forecast_length (days) -> flow (CFS) aligned to exceedanceQuantiles. */
  flowsByWindow: Record<number, number[]>;
}

export type FloodWindow = 5 | 10;

export interface FloodProbabilityResult {
  /** Exceedance probability in [0.1, 0.9], or null when below the 0.1 exceedance. */
  probability: number | null;
  /** Which forecast window produced the reported probability. */
  windowDays: FloodWindow;
  /** True when both windows fall below the least-likely (0.1) exceedance. */
  isLow: boolean;
}

/**
 * The display bucket for the combined (forecast + observed) flood chance. The
 * forecast path is clamped at 90% (a lower bound → "veryHighClamp"); the observed
 * path is precise (90/95 → "veryHigh", rounds-to-100 / above p99 → "nearCertain").
 */
export type FloodChanceLevel =
  | { level: "low" }
  | { level: "percent"; percent: number }
  | { level: "veryHighClamp" }
  | { level: "veryHigh"; percent: number }
  | { level: "nearCertain" };

export interface FloodChanceResult {
  windowDays: FloodWindow;
  chance: FloodChanceLevel;
}
