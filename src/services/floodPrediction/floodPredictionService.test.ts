import AsyncStorage from "@react-native-async-storage/async-storage";

import CONSTANTS_FIXTURE from "@services/floodPrediction/__tests__/fixtures/floodPredictionConstants.json";

import { __resetConstantsForTest, __setConstantsForTest } from "./constantsSource";
import {
  __resetFloodPredictionCaches,
  getCachedFloodProbability,
  getFloodProbability,
  getGaugeConstants,
  hasFloodProbabilityFailed,
} from "./floodPredictionService";

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

const MIRROR = "floodzilla.com/files/prediction/ratings/";
const USGS = "waterdata.usgs.gov/nwisweb/get_ratings";
// Either rating-table source: the floodzilla.com mirror or USGS direct.
const isRatingUrl = (url: string) => url.includes(MIRROR) || url.includes(USGS);

function mockFetch() {
  return jest.fn((url: string) => {
    if (isRatingUrl(url)) {
      return Promise.resolve({ ok: true, text: () => Promise.resolve(RATING) });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve(QUANTILES) });
  });
}

describe("getFloodProbability", () => {
  beforeEach(async () => {
    // The constants are fetched at runtime in the app; tests publish the shipped
    // fixture so the real SVPA-25 coefficients below stay meaningful.
    __setConstantsForTest(CONSTANTS_FIXTURE);
    __resetFloodPredictionCaches();
    (globalThis as any).fetch = mockFetch();
    await AsyncStorage.clear();
  });

  afterEach(() => {
    __resetConstantsForTest();
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
      isRatingUrl(String(c[0]))
    );
    expect(ratingCalls.length).toBe(1);
  });

  // Rating-table sources, in order: floodzilla.com mirror → USGS direct (behind
  // an AWS WAF bot challenge) → last known-good copy in storage. A failed or
  // unparseable table must never produce a probability: an empty table makes
  // every curve height NaN, which used to fall through to a false ">90%".
  describe("rating-table sources and bad responses", () => {
    const ERROR_PAGE = "<HTML><HEAD><TITLE>ERROR</TITLE></HEAD><BODY>403 ERROR</BODY></HTML>";
    type Source = { ok: boolean; body: string; status?: number };
    const GOOD: Source = { ok: true, body: RATING };
    const NOT_FOUND: Source = { ok: false, body: "Not Found", status: 404 };
    // USGS's WAF challenge: an empty 202.
    const CHALLENGE: Source = { ok: true, body: "", status: 202 };

    function fetchWith(sources: { mirror: Source; usgs: Source }, quantilesOk = true) {
      return jest.fn((url: string) => {
        const src = url.includes(MIRROR) ? sources.mirror : sources.usgs;
        if (isRatingUrl(url)) {
          return Promise.resolve({
            ok: src.ok,
            status: src.status ?? (src.ok ? 200 : 500),
            text: () => Promise.resolve(src.body),
          });
        }
        return Promise.resolve({ ok: quantilesOk, json: () => Promise.resolve(QUANTILES) });
      });
    }

    const calledUrls = () => (globalThis.fetch as jest.Mock).mock.calls.map((c) => String(c[0]));

    it("uses the mirror first and skips USGS when it succeeds", async () => {
      (globalThis as any).fetch = fetchWith({ mirror: GOOD, usgs: CHALLENGE });
      expect(await getFloodProbability("USGS-38", 44.6)).not.toBeNull();
      expect(calledUrls()).toContain(`https://${MIRROR}12144500.txt`);
      expect(calledUrls().some((u) => u.includes(USGS))).toBe(false);
    });

    it("falls back to USGS when the mirror is missing", async () => {
      (globalThis as any).fetch = fetchWith({ mirror: NOT_FOUND, usgs: GOOD });
      expect(await getFloodProbability("USGS-38", 44.6)).not.toBeNull();
    });

    it("falls back to the stored copy when every source fails", async () => {
      // A first, successful load stores the table...
      await getFloodProbability("USGS-38", 44.6);
      const fresh = getCachedFloodProbability("USGS-38", 44.6);
      // ...so a later session with both sources down still computes the same result.
      __resetFloodPredictionCaches();
      (globalThis as any).fetch = fetchWith({ mirror: NOT_FOUND, usgs: CHALLENGE });
      expect(await getFloodProbability("USGS-38", 44.6)).toEqual(fresh);
    });

    it.each([
      [
        "a non-OK response",
        { mirror: NOT_FOUND, usgs: { ok: false, body: ERROR_PAGE, status: 403 } },
      ],
      [
        "an OK error page with no rating rows",
        { mirror: NOT_FOUND, usgs: { ok: true, body: ERROR_PAGE } },
      ],
      ["the WAF challenge (empty 202)", { mirror: NOT_FOUND, usgs: CHALLENGE }],
    ])("rejects with no stored copy on %s, and marks it failed", async (_label, sources) => {
      (globalThis as any).fetch = fetchWith(sources);
      await expect(getFloodProbability("SVPA-25")).rejects.toThrow();
      await expect(getFloodProbability("USGS-38", 44.6)).rejects.toThrow();
      expect(getCachedFloodProbability("SVPA-25")).toBeUndefined();
      expect(getCachedFloodProbability("USGS-38", 44.6)).toBeUndefined();
      expect(hasFloodProbabilityFailed("SVPA-25")).toBe(true);
      expect(hasFloodProbabilityFailed("USGS-38", 44.6)).toBe(true);
      // Keyed per threshold: an unrequested key isn't marked.
      expect(hasFloodProbabilityFailed("USGS-38")).toBe(false);
    });

    it("rejects a 2xx map-quantiles body that isn't a forecast, and retries it", async () => {
      const errorBody = jest.fn((url: string) =>
        isRatingUrl(url)
          ? Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve(RATING) })
          : Promise.resolve({ ok: true, json: () => Promise.resolve({ detail: "Not found" }) })
      );
      (globalThis as any).fetch = errorBody;
      await expect(getFloodProbability("USGS-38", 44.6)).rejects.toThrow();
      expect(getCachedFloodProbability("USGS-38", 44.6)).toBeUndefined();
      expect(hasFloodProbabilityFailed("USGS-38", 44.6)).toBe(true);
      // The bad payload is not held in the 15-minute quantile cache.
      (globalThis as any).fetch = mockFetch();
      expect(await getFloodProbability("USGS-38", 44.6)).not.toBeNull();
      expect(hasFloodProbabilityFailed("USGS-38", 44.6)).toBe(false);
    });

    it("rejects on a non-OK map-quantiles response", async () => {
      (globalThis as any).fetch = fetchWith({ mirror: GOOD, usgs: GOOD }, false);
      await expect(getFloodProbability("USGS-38", 44.6)).rejects.toThrow();
      expect(getCachedFloodProbability("USGS-38", 44.6)).toBeUndefined();
      expect(hasFloodProbabilityFailed("USGS-38", 44.6)).toBe(true);
    });

    it("retries after a failure and clears the failed mark on success", async () => {
      (globalThis as any).fetch = fetchWith({ mirror: NOT_FOUND, usgs: CHALLENGE });
      await expect(getFloodProbability("USGS-38", 44.6)).rejects.toThrow();
      (globalThis as any).fetch = mockFetch();
      expect(await getFloodProbability("USGS-38", 44.6)).not.toBeNull();
      expect(hasFloodProbabilityFailed("USGS-38", 44.6)).toBe(false);
    });
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
      isRatingUrl(String(c[0]))
    );
    expect(String(ratingCall![0])).toContain("12150800");
  });

  // The resolved result is cached for synchronous reads so consumers surface it
  // on any render, not just when a single async update lands.
  it("caches the resolved result, keyed by gauge + threshold, for sync reads", async () => {
    expect(getCachedFloodProbability("USGS-SH5", 44.6)).toBeUndefined();
    const r = await getFloodProbability("USGS-SH5", 44.6);
    expect(getCachedFloodProbability("USGS-SH5", 44.6)).toEqual(r);
    // A different threshold is a different cache entry.
    expect(getCachedFloodProbability("USGS-SH5", 44.5)).toBeUndefined();
  });

  it("caches an SVPA result under the bare locationId", async () => {
    await getFloodProbability("SVPA-25");
    expect(getCachedFloodProbability("SVPA-25")).not.toBeUndefined();
  });

  // The SVPA threshold shift: a higher threshold (road saddle above red stage)
  // maps to a higher predictor stage, so its exceedance probability is <= the red
  // stage's. The no-threshold call is the red-stage baseline (Δ = 0).
  it("SVPA: a higher threshold yields a probability <= the red-stage probability", async () => {
    const constants = getGaugeConstants("SVPA-25")!;
    const roadSaddle = constants.floodProbability.redStage + 2; // above red stage
    const red = await getFloodProbability("SVPA-25");
    const road = await getFloodProbability("SVPA-25", roadSaddle);
    expect(road).not.toBeNull();
    expect(road!.probability ?? 0).toBeLessThanOrEqual(red!.probability ?? 0);
  });

  it("SVPA: threshold equal to redStage matches the no-threshold result (Δ = 0)", async () => {
    const constants = getGaugeConstants("SVPA-25")!;
    const baseline = await getFloodProbability("SVPA-25");
    __resetFloodPredictionCaches();
    (globalThis as any).fetch = mockFetch();
    const atRed = await getFloodProbability("SVPA-25", constants.floodProbability.redStage);
    expect(atRed).toEqual(baseline);
  });

  it("SVPA: a road threshold caches under a suffixed key, distinct from red", async () => {
    const roadSaddle = getGaugeConstants("SVPA-25")!.floodProbability.redStage + 2;
    await getFloodProbability("SVPA-25", roadSaddle);
    expect(getCachedFloodProbability("SVPA-25", roadSaddle)).not.toBeUndefined();
    // The bare red-stage entry is a different cache slot.
    expect(getCachedFloodProbability("SVPA-25")).toBeUndefined();
  });
});
