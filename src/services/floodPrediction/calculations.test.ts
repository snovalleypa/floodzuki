import {
  parseRatingTable,
  flowToHeight,
  parseMapQuantiles,
  buildExceedanceHeightCurve,
  heightToProbability,
  computeFloodProbability,
  derivePredictorStageProbability,
  combineFloodChance,
} from "./calculations";
import { FloodProbabilityResult } from "./types";

const SAMPLE = [
  "# //comment line",
  "INDEP\tSHIFT\tDEP\tSTOR",
  "16N\t16N\t16N\t1S",
  "44.50\t-0.40\t100\t",
  "44.60\t-0.40\t200\t",
  "44.70\t-0.40\t400\t*",
].join("\n");

const RAW = {
  metadata: { exceedance_quantiles: [0.1, 0.5, 0.9] },
  value_set: [
    { forecast_length: 5, quantile_values: [400, 200, 100] },
    { forecast_length: 10, quantile_values: [400, 200, 100] },
  ],
};

describe("parseRatingTable", () => {
  it("keeps only numeric data rows as (gageHeight, discharge)", () => {
    expect(parseRatingTable(SAMPLE)).toEqual([
      { gageHeight: 44.5, discharge: 100 },
      { gageHeight: 44.6, discharge: 200 },
      { gageHeight: 44.7, discharge: 400 },
    ]);
  });
});

describe("flowToHeight", () => {
  const table = parseRatingTable(SAMPLE);

  it("interpolates linearly between points", () => {
    expect(flowToHeight(table, 150)).toBeCloseTo(44.55, 5);
    expect(flowToHeight(table, 300)).toBeCloseTo(44.65, 5);
  });

  it("clamps below the first and above the last point (no extrapolation)", () => {
    expect(flowToHeight(table, 50)).toBe(44.5);
    expect(flowToHeight(table, 9999)).toBe(44.7);
  });
});

describe("parseMapQuantiles", () => {
  it("indexes flows by forecast window", () => {
    const q = parseMapQuantiles(RAW as any);
    expect(q.exceedanceQuantiles).toEqual([0.1, 0.5, 0.9]);
    expect(q.flowsByWindow[5]).toEqual([400, 200, 100]);
    expect(q.flowsByWindow[10]).toEqual([400, 200, 100]);
  });
});

describe("buildExceedanceHeightCurve + heightToProbability", () => {
  const table = parseRatingTable(SAMPLE);
  const q = parseMapQuantiles(RAW as any);
  const curve = buildExceedanceHeightCurve(q, table, 5);
  // curve points: (0.1, 44.7) (0.5, 44.6) (0.9, 44.5)

  it("returns null above the 0.1-exceedance height", () => {
    expect(heightToProbability(curve, 44.75)).toBeNull();
  });

  it("returns 0.1 at the 0.1-exceedance height", () => {
    expect(heightToProbability(curve, 44.7)).toBeCloseTo(0.1, 6);
  });

  it("interpolates between exceedance points", () => {
    expect(heightToProbability(curve, 44.65)).toBeCloseTo(0.3, 6);
  });

  it("clamps to 0.9 below the lowest height", () => {
    expect(heightToProbability(curve, 44.0)).toBeCloseTo(0.9, 6);
  });
});

describe("computeFloodProbability", () => {
  const table = parseRatingTable(SAMPLE);
  const quantiles = parseMapQuantiles(RAW as any);

  it("returns the greater window's probability (non-null tie -> 5-day)", () => {
    const r = computeFloodProbability({ p99: 44.65, quantiles, ratingTable: table });
    expect(r.probability).toBeCloseTo(0.3, 6);
    expect(r.isLow).toBe(false);
    expect(r.windowDays).toBe(5);
  });

  it("flags low (against the 10-day window) when p99 is above both 0.1-exceedance heights", () => {
    const r = computeFloodProbability({ p99: 50, quantiles, ratingTable: table });
    expect(r.probability).toBeNull();
    expect(r.isLow).toBe(true);
    expect(r.windowDays).toBe(10);
  });
});

describe("derivePredictorStageProbability", () => {
  // Tolt Hill Road (SVPA-25) constants; p10 = 2*53.7 - 54.38 = 53.02.
  const fp = { p50: 53.7, p90: 54.38, p99: 54.94 };

  it("hits the anchor probabilities at p10/p50/p90/p99", () => {
    expect(derivePredictorStageProbability(fp, 53.02)).toBeCloseTo(0.1, 6);
    expect(derivePredictorStageProbability(fp, fp.p50)).toBeCloseTo(0.5, 6);
    expect(derivePredictorStageProbability(fp, fp.p90)).toBeCloseTo(0.9, 6);
    expect(derivePredictorStageProbability(fp, fp.p99)).toBeCloseTo(0.99, 6);
  });

  it("exceeds 0.99 above p99 and drops below 0.10 below p10", () => {
    expect(derivePredictorStageProbability(fp, 55.5)).toBeGreaterThan(0.99);
    expect(derivePredictorStageProbability(fp, 52)).toBeLessThan(0.1);
  });
});

describe("combineFloodChance", () => {
  const forecast = (
    probability: number | null,
    windowDays: 5 | 10 = 5
  ): FloodProbabilityResult => ({
    probability,
    windowDays,
    isLow: probability === null,
  });

  it("returns null when there is neither a forecast nor an observed value", () => {
    expect(combineFloodChance({ forecast: null, observedProbability: null })).toBeNull();
  });

  it("shows Low when the forecast is low and there is no observed value", () => {
    const r = combineFloodChance({ forecast: forecast(null, 10), observedProbability: null });
    expect(r).toEqual({ windowDays: 10, chance: { level: "low" } });
  });

  it("shows a rounded percentage in the mid range", () => {
    const r = combineFloodChance({ forecast: forecast(0.5), observedProbability: null });
    expect(r!.chance).toEqual({ level: "percent", percent: 50 });
  });

  it("labels the clamped forecast maximum as Very High (>90%)", () => {
    const r = combineFloodChance({ forecast: forecast(0.9), observedProbability: null });
    expect(r!.chance).toEqual({ level: "veryHighClamp" });
  });

  it("uses the observed value when it is higher, with the exact percent", () => {
    const r = combineFloodChance({ forecast: forecast(0.5), observedProbability: 0.95 });
    expect(r!.chance).toEqual({ level: "veryHigh", percent: 95 });
  });

  it("keeps the forecast on a tie (observed must be strictly greater)", () => {
    const r = combineFloodChance({ forecast: forecast(0.9), observedProbability: 0.9 });
    expect(r!.chance).toEqual({ level: "veryHighClamp" });
  });

  it("shows near-certain when the observed value rounds to 100", () => {
    const r = combineFloodChance({ forecast: forecast(0.5), observedProbability: 0.995 });
    expect(r!.chance).toEqual({ level: "nearCertain" });
  });
});
