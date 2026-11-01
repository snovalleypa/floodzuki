import {
  parseRatingTable,
  flowToHeight,
  parseMapQuantiles,
  buildExceedanceHeightCurve,
  heightToProbability,
  computeFloodProbability,
  derivePredictorStageProbability,
  combineFloodChance,
  floodChanceRiskLevel,
  predictorStageForThreshold,
  shiftFloodProbabilityConstants,
} from "./calculations";
import { FloodProbabilityResult, FloodRiskLevel } from "./types";

describe("predictorStageForThreshold", () => {
  const fp = { redStage: 74.12, p50: 10.38, p90: 11.06, p99: 11.61, residualSigma: 0.6485 };
  const slope = 1.2184;

  it("returns p99 unchanged when threshold equals redStage", () => {
    expect(predictorStageForThreshold(fp, slope, 74.12)).toBeCloseTo(11.61, 5);
  });

  it("returns p99 unchanged when threshold is undefined", () => {
    expect(predictorStageForThreshold(fp, slope, undefined)).toBeCloseTo(11.61, 5);
  });

  it("shifts up for a road saddle above red stage", () => {
    // Δ = (76.55 - 74.12) / 1.2184 = 1.9944; p99 + Δ = 13.6044
    expect(predictorStageForThreshold(fp, slope, 76.55)).toBeCloseTo(13.6044, 3);
  });
});

describe("shiftFloodProbabilityConstants", () => {
  const fp = { redStage: 74.12, p50: 10.38, p90: 11.06, p99: 11.61, residualSigma: 0.6485 };
  const slope = 1.2184;

  it("is unchanged at threshold = redStage", () => {
    expect(shiftFloodProbabilityConstants(fp, slope, 74.12)).toEqual({
      p50: 10.38,
      p90: 11.06,
      p99: 11.61,
    });
  });

  it("is unchanged when threshold is undefined", () => {
    expect(shiftFloodProbabilityConstants(fp, slope, undefined)).toEqual({
      p50: 10.38,
      p90: 11.06,
      p99: 11.61,
    });
  });

  it("shifts all three quantiles by the same Δ", () => {
    const out = shiftFloodProbabilityConstants(fp, slope, 76.55); // Δ ≈ 1.9944
    expect(out.p50).toBeCloseTo(12.3744, 3);
    expect(out.p90).toBeCloseTo(13.0544, 3);
    expect(out.p99).toBeCloseTo(13.6044, 3);
  });
});

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
    const q = parseMapQuantiles(RAW as any)!;
    expect(q.exceedanceQuantiles).toEqual([0.1, 0.5, 0.9]);
    expect(q.flowsByWindow[5]).toEqual([400, 200, 100]);
    expect(q.flowsByWindow[10]).toEqual([400, 200, 100]);
  });

  it("keeps extra windows", () => {
    const raw = {
      ...RAW,
      value_set: [...RAW.value_set, { forecast_length: 15, quantile_values: [800, 400, 200] }],
    };
    expect(parseMapQuantiles(raw as any)!.flowsByWindow[15]).toEqual([800, 400, 200]);
  });

  // A 2xx body that isn't a usable forecast must be rejected, not normalized to
  // something that computes: missing windows or null flows read as a false
  // "Low", and a short flow array falls through to a false ">90%".
  const withWindow = (forecast_length: number, quantile_values: unknown[]) => ({
    metadata: { exceedance_quantiles: [0.1, 0.5, 0.9] },
    value_set: [
      { forecast_length: 5, quantile_values: [400, 200, 100] },
      { forecast_length: 10, quantile_values: [400, 200, 100] },
    ].map((vs) => (vs.forecast_length === forecast_length ? { ...vs, quantile_values } : vs)),
  });

  it.each([
    ["an error body", { detail: "Not found" }],
    ["a null body", null],
    ["missing metadata", { value_set: RAW.value_set }],
    ["empty exceedance quantiles", { ...RAW, metadata: { exceedance_quantiles: [] } }],
    [
      "a non-numeric exceedance quantile",
      { ...RAW, metadata: { exceedance_quantiles: [0.1, "x", 0.9] } },
    ],
    [
      "only the 15/20-day windows",
      { ...RAW, value_set: [{ forecast_length: 15, quantile_values: [400, 200, 100] }] },
    ],
    ["a missing 10-day window", { ...RAW, value_set: [RAW.value_set[0]] }],
    ["null flow values", withWindow(5, [null, null, null])],
    ["a NaN flow value", withWindow(10, [400, NaN, 100])],
    ["fewer flows than quantiles", withWindow(5, [400])],
    ["more flows than quantiles", withWindow(5, [400, 300, 200, 100])],
  ])("returns null for %s", (_label, raw) => {
    expect(parseMapQuantiles(raw as any)).toBeNull();
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

  // Defense in depth: an uncomputable input must surface as a failure, never
  // fall through the interpolation clamps to a false "Low" or false ">90%".
  describe("throws instead of computing on bad inputs", () => {
    it.each([NaN, Infinity, undefined as unknown as number])("for a non-finite p99 (%p)", (p99) => {
      expect(() => computeFloodProbability({ p99, quantiles, ratingTable: table })).toThrow();
    });

    it("for an empty rating table (every height NaN)", () => {
      expect(() => computeFloodProbability({ p99: 44.65, quantiles, ratingTable: [] })).toThrow();
    });

    it("for a window missing from the quantiles", () => {
      const only5 = { ...quantiles, flowsByWindow: { 5: quantiles.flowsByWindow[5] } };
      expect(() =>
        computeFloodProbability({ p99: 44.65, quantiles: only5, ratingTable: table })
      ).toThrow();
    });

    it("for a non-finite flow in a window", () => {
      const bad = {
        ...quantiles,
        flowsByWindow: { ...quantiles.flowsByWindow, 10: [400, NaN, 100] },
      };
      expect(() =>
        computeFloodProbability({ p99: 44.65, quantiles: bad, ratingTable: table })
      ).toThrow();
    });
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

  // With no forecast (loading or failed), the observed value is only a lower
  // bound on the days-out chance: a Low/<=30% reading can't vouch that the river
  // won't flood in the window, so it reports nothing rather than "Low".
  describe("without a forecast", () => {
    it.each([0.02, 0.2, 0.3])("reports nothing for a Low observed value (%p)", (observed) => {
      expect(combineFloodChance({ forecast: null, observedProbability: observed })).toBeNull();
    });

    it("shows a Medium observed value", () => {
      const r = combineFloodChance({ forecast: null, observedProbability: 0.4 });
      expect(r!.chance).toEqual({ level: "percent", percent: 40 });
    });

    it("shows a High observed value with the exact percent", () => {
      const r = combineFloodChance({ forecast: null, observedProbability: 0.95 });
      expect(r!.chance).toEqual({ level: "veryHigh", percent: 95 });
    });
  });

  it("still shows a Low observed value when a forecast is present", () => {
    const r = combineFloodChance({ forecast: forecast(0.15), observedProbability: 0.2 });
    expect(r!.chance).toEqual({ level: "percent", percent: 20 });
  });
});

describe("floodChanceRiskLevel", () => {
  it("maps the low bucket to Low", () => {
    expect(floodChanceRiskLevel({ level: "low" })).toBe(FloodRiskLevel.Low);
  });

  it("maps every very-high bucket (>=90%) to High", () => {
    expect(floodChanceRiskLevel({ level: "veryHighClamp" })).toBe(FloodRiskLevel.High);
    expect(floodChanceRiskLevel({ level: "veryHigh", percent: 95 })).toBe(FloodRiskLevel.High);
    expect(floodChanceRiskLevel({ level: "nearCertain" })).toBe(FloodRiskLevel.High);
  });

  it("treats 70% and above as High", () => {
    expect(floodChanceRiskLevel({ level: "percent", percent: 70 })).toBe(FloodRiskLevel.High);
    expect(floodChanceRiskLevel({ level: "percent", percent: 85 })).toBe(FloodRiskLevel.High);
  });

  it("treats 35-65% as Medium", () => {
    expect(floodChanceRiskLevel({ level: "percent", percent: 35 })).toBe(FloodRiskLevel.Medium);
    expect(floodChanceRiskLevel({ level: "percent", percent: 65 })).toBe(FloodRiskLevel.Medium);
  });

  it("treats 30% and below as Low", () => {
    expect(floodChanceRiskLevel({ level: "percent", percent: 30 })).toBe(FloodRiskLevel.Low);
    expect(floodChanceRiskLevel({ level: "percent", percent: 10 })).toBe(FloodRiskLevel.Low);
  });
});
