import { __resetFloodPredictionCaches, getFloodProbability } from "./floodPredictionService";

const RATING = [
  "# comment",
  "INDEP\tSHIFT\tDEP\tSTOR",
  "16N\t16N\t16N\t1S",
  "44.5\t0\t100\t",
  "44.6\t0\t200\t",
  "44.7\t0\t400\t",
].join("\n");

const QUANTILES = {
  metadata: { exceedance_quantiles: [0.1, 0.5, 0.9] },
  value_set: [
    { forecast_length: 5, quantile_values: [400, 200, 100] },
    { forecast_length: 10, quantile_values: [400, 200, 100] },
  ],
};

function mockFetch() {
  return jest.fn((url: string) => {
    if (url.includes("get_ratings")) {
      return Promise.resolve({ ok: true, text: () => Promise.resolve(RATING) });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve(QUANTILES) });
  });
}

describe("getFloodProbability", () => {
  beforeEach(() => {
    __resetFloodPredictionCaches();
    (globalThis as any).fetch = mockFetch();
  });

  it("returns null for a gauge not in the constants", async () => {
    expect(await getFloodProbability("SVPA-999")).toBeNull();
  });

  it("computes a result for a covered gauge", async () => {
    const r = await getFloodProbability("SVPA-25"); // Tolt Hill Road, Carnation
    expect(r).not.toBeNull();
    expect(typeof r!.windowDays).toBe("number");
    expect("isLow" in r!).toBe(true);
  });

  it("caches the rating table (fetched once across calls)", async () => {
    await getFloodProbability("SVPA-25");
    await getFloodProbability("SVPA-25");
    const ratingCalls = (globalThis.fetch as jest.Mock).mock.calls.filter((c) =>
      String(c[0]).includes("get_ratings")
    );
    expect(ratingCalls.length).toBe(1);
  });

  // Direct USGS gauges: the gauge is its own predictor, threshold = its red
  // stage. With the fixtures above the exceedance curve is (0.1,44.7) (0.5,44.6)
  // (0.9,44.5), so the red stage maps straight onto the exceedance probability.
  it("computes a direct USGS gauge using its red stage as the threshold", async () => {
    const r = await getFloodProbability("USGS-SH5", 44.6);
    expect(r).not.toBeNull();
    expect(r!.probability).toBeCloseTo(0.5, 5);
  });

  it("moves the probability as the direct gauge's red stage changes", async () => {
    const least = await getFloodProbability("USGS-SH5", 44.7);
    const most = await getFloodProbability("USGS-SH5", 44.5);
    expect(least!.probability).toBeCloseTo(0.1, 5);
    expect(most!.probability).toBeCloseTo(0.9, 5);
  });

  it("returns null for a direct gauge with no red stage", async () => {
    expect(await getFloodProbability("USGS-SH5")).toBeNull();
  });

  it("fetches the direct gauge's own USGS rating site", async () => {
    await getFloodProbability("USGS-SH5", 44.6);
    const ratingCall = (globalThis.fetch as jest.Mock).mock.calls.find((c) =>
      String(c[0]).includes("get_ratings")
    );
    expect(String(ratingCall![0])).toContain("12150800");
  });
});
