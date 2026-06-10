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
    (global as any).fetch = mockFetch();
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
    const ratingCalls = (global.fetch as jest.Mock).mock.calls.filter((c) =>
      String(c[0]).includes("get_ratings")
    );
    expect(ratingCalls.length).toBe(1);
  });
});
