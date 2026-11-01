import AsyncStorage from "@react-native-async-storage/async-storage";

import CONSTANTS_FIXTURE from "@services/floodPrediction/__tests__/fixtures/floodPredictionConstants.json";
import {
  __resetConstantsForTest,
  __setConstantsForTest,
} from "@services/floodPrediction/constantsSource";
import {
  __resetFloodPredictionCaches,
  getFloodProbability,
} from "@services/floodPrediction/floodPredictionService";

import { isFloodForecastUnavailable } from "../useFloodProbability";

// Every source down: mirror 404, USGS WAF challenge (empty 202), no stored copy.
const failingFetch = jest.fn((url: string) =>
  Promise.resolve(
    url.includes("map-quantiles")
      ? { ok: true, json: () => Promise.resolve({}) }
      : { ok: url.includes("get_ratings"), status: 202, text: () => Promise.resolve("") }
  )
);

beforeEach(async () => {
  __setConstantsForTest(CONSTANTS_FIXTURE);
  __resetFloodPredictionCaches();
  (globalThis as any).fetch = failingFetch;
  await AsyncStorage.clear();
});

afterEach(() => {
  __resetConstantsForTest();
});

// The hook requests (and the service keys) a direct USGS gauge under its red
// stage, and an SVPA gauge under the bare locationId; the unavailable check must
// read the same key or the row would spin forever.
describe("isFloodForecastUnavailable", () => {
  it("is false before anything has been requested", () => {
    expect(isFloodForecastUnavailable({ locationId: "USGS-38", redStage: 44.6 } as never)).toBe(
      false
    );
  });

  it("matches a direct USGS gauge's red-stage key", async () => {
    const gage = { locationId: "USGS-38", redStage: 44.6 } as never;
    await expect(getFloodProbability("USGS-38", 44.6)).rejects.toThrow();
    expect(isFloodForecastUnavailable(gage)).toBe(true);
  });

  it("matches an SVPA gauge's bare key, and a road threshold separately", async () => {
    const gage = { locationId: "SVPA-25", redStage: 66.51 } as never;
    await expect(getFloodProbability("SVPA-25")).rejects.toThrow();
    expect(isFloodForecastUnavailable(gage)).toBe(true);
    expect(isFloodForecastUnavailable(gage, 68)).toBe(false);
  });
});
