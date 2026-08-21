/// <reference types="node" />
import { existsSync } from "fs";
import { join } from "path";

import * as storage from "@utils/storage";

import {
  __resetConstantsForTest,
  __setConstantsForTest,
  getConstantsUrl,
  getGauges,
  getPredictors,
  loadFloodPredictionConstants,
  parseConstants,
} from "../constantsSource";

jest.mock("../../../config/config", () => ({
  __esModule: true,
  default: { FLOOD_PREDICTION_CONSTANTS_BASE_URL: "https://floodzilla.com/files/prediction/" },
}));

const BASE = "https://floodzilla.com/files/prediction/";
const STORAGE_KEY = "flood-prediction-constants-v1";

const GAUGE = {
  gaugeId: "SVPA-25",
  name: "Tolt Hill Road",
  redStage: 66.51,
  predictor: {
    floodzillaId: "USGS-22",
    usgsSiteId: "12149000",
    noaaSiteId: "CRNW1",
    name: "Carnation",
  },
  regression: { slope: 0.9925, intercept: 16.0117 },
  floodProbability: { redStage: 66.51, residualSigma: 0.2412, p50: 50.88, p90: 51.19, p99: 51.44 },
  validRange: { minPredictorStage: 48, maxPredictorStage: 56 },
  fit: { r2: 0.97, n: 22 },
};

const PAYLOAD = {
  schemaVersion: 1,
  gauges: [GAUGE],
  predictors: {
    "12149000": {
      floodzillaId: "USGS-22",
      usgsSiteId: "12149000",
      noaaSiteId: "CRNW1",
      name: "Carnation",
    },
  },
};

function mockFetch(body: unknown, ok = true) {
  globalThis.fetch = jest.fn().mockResolvedValue({ ok, json: async () => body }) as never;
}

function mockFetchReject() {
  globalThis.fetch = jest.fn().mockRejectedValue(new Error("offline")) as never;
}

beforeEach(async () => {
  __resetConstantsForTest();
  await storage.remove(STORAGE_KEY);
});

describe("getConstantsUrl", () => {
  it("builds the per-region url", () => {
    expect(getConstantsUrl(1)).toBe(BASE + "flood-prediction-constants-region-1.json");
    expect(getConstantsUrl(2)).toBe(BASE + "flood-prediction-constants-region-2.json");
  });
});

describe("accessors before any load", () => {
  it("return empty containers, never undefined", () => {
    expect(getGauges()).toEqual([]);
    expect(getPredictors()).toEqual({});
  });
});

describe("parseConstants", () => {
  it("accepts a well-formed payload", () => {
    const parsed = parseConstants(PAYLOAD);
    expect(parsed?.gauges).toHaveLength(1);
    expect(parsed?.predictors["12149000"].noaaSiteId).toBe("CRNW1");
  });

  it("rejects a wrong schemaVersion", () => {
    expect(parseConstants({ ...PAYLOAD, schemaVersion: 2 })).toBeNull();
  });

  it("rejects a non-array gauges field", () => {
    expect(parseConstants({ schemaVersion: 1, gauges: {} })).toBeNull();
  });

  it("rejects null and non-objects", () => {
    expect(parseConstants(null)).toBeNull();
    expect(parseConstants("nope")).toBeNull();
  });

  // p50 and p90 feed derivePredictorStageProbability; a gauge missing either
  // would yield NaN probabilities rather than an absent row.
  it.each(["redStage", "residualSigma", "p50", "p90", "p99"])(
    "drops a gauge whose floodProbability.%s is missing",
    (field) => {
      const bad = { ...GAUGE, floodProbability: { ...GAUGE.floodProbability } };
      delete (bad.floodProbability as Record<string, unknown>)[field];
      expect(parseConstants({ ...PAYLOAD, gauges: [bad] })).toBeNull();
    }
  );

  it("drops a gauge missing regression coefficients", () => {
    const bad = { ...GAUGE, regression: { slope: 1 } };
    expect(parseConstants({ ...PAYLOAD, gauges: [bad] })).toBeNull();
  });

  it("drops a gauge missing predictor site ids", () => {
    const bad = { ...GAUGE, predictor: { ...GAUGE.predictor, noaaSiteId: "" } };
    expect(parseConstants({ ...PAYLOAD, gauges: [bad] })).toBeNull();
  });

  it("keeps good gauges and drops only the bad ones", () => {
    const bad = { ...GAUGE, gaugeId: "SVPA-BAD", regression: {} };
    const parsed = parseConstants({ ...PAYLOAD, gauges: [GAUGE, bad] });
    expect(parsed?.gauges.map((g) => g.gaugeId)).toEqual(["SVPA-25"]);
  });

  it("tolerates a missing predictors block", () => {
    const parsed = parseConstants({ schemaVersion: 1, gauges: [GAUGE] });
    expect(parsed?.predictors).toEqual({});
  });
});

describe("loadFloodPredictionConstants", () => {
  it("publishes and persists a successful fetch", async () => {
    mockFetch(PAYLOAD);
    await loadFloodPredictionConstants(1);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      BASE + "flood-prediction-constants-region-1.json"
    );
    expect(getGauges().map((g) => g.gaugeId)).toEqual(["SVPA-25"]);
    expect(getPredictors()["12149000"].floodzillaId).toBe("USGS-22");
    expect((await storage.load(STORAGE_KEY)).gauges).toHaveLength(1);
  });

  it("falls back to the cached copy when the network fails", async () => {
    await storage.save(STORAGE_KEY, PAYLOAD);
    mockFetchReject();
    await loadFloodPredictionConstants(1);
    expect(getGauges().map((g) => g.gaugeId)).toEqual(["SVPA-25"]);
  });

  it("falls back to the cached copy on a non-OK response", async () => {
    await storage.save(STORAGE_KEY, PAYLOAD);
    mockFetch({}, false);
    await loadFloodPredictionConstants(1);
    expect(getGauges()).toHaveLength(1);
  });

  it("leaves the box empty when there is neither cache nor network", async () => {
    mockFetchReject();
    await loadFloodPredictionConstants(1);
    expect(getGauges()).toEqual([]);
  });

  it("ignores a corrupt cached copy", async () => {
    await storage.save(STORAGE_KEY, { schemaVersion: 99, gauges: "junk" });
    mockFetchReject();
    await loadFloodPredictionConstants(1);
    expect(getGauges()).toEqual([]);
  });

  it("keeps previously published constants when a refresh returns garbage", async () => {
    mockFetch(PAYLOAD);
    await loadFloodPredictionConstants(1);
    mockFetch({ schemaVersion: 1, gauges: [] });
    await loadFloodPredictionConstants(1);
    expect(getGauges()).toHaveLength(1);
  });

  it("keeps previously published constants when a refresh throws", async () => {
    mockFetch(PAYLOAD);
    await loadFloodPredictionConstants(1);
    mockFetchReject();
    await loadFloodPredictionConstants(1);
    expect(getGauges()).toHaveLength(1);
  });

  // The box-empty guard: on a second load the (older) cached copy must not
  // overwrite constants that are already published.
  it("does not let a stale cache clobber already-published constants", async () => {
    const fresh = {
      ...PAYLOAD,
      gauges: [{ ...GAUGE, gaugeId: "SVPA-FRESH" }],
    };
    mockFetch(fresh);
    await loadFloodPredictionConstants(1);

    await storage.save(STORAGE_KEY, PAYLOAD); // an older cached copy
    mockFetchReject();
    await loadFloodPredictionConstants(1);
    expect(getGauges().map((g) => g.gaugeId)).toEqual(["SVPA-FRESH"]);
  });
});

describe("__setConstantsForTest", () => {
  it("publishes a raw payload through the parser", () => {
    __setConstantsForTest(PAYLOAD);
    expect(getGauges()).toHaveLength(1);
  });

  it("clears the box for an invalid payload", () => {
    __setConstantsForTest(PAYLOAD);
    __setConstantsForTest({ schemaVersion: 9 });
    expect(getGauges()).toEqual([]);
  });
});

describe("no bundled constants", () => {
  it("does not ship a constants JSON under src/config", () => {
    // The app must reach the constants over the network, never through the
    // bundle. The only copy left in the repo is the test fixture.
    expect(existsSync(join(__dirname, "../../../config/floodPredictionConstants.json"))).toBe(
      false
    );
    expect(existsSync(join(__dirname, "fixtures/floodPredictionConstants.json"))).toBe(true);
  });
});
