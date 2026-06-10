import {
  parseRatingTable,
  flowToHeight,
  parseMapQuantiles,
  buildExceedanceHeightCurve,
  heightToProbability,
  computeFloodProbability,
} from "./calculations";

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
