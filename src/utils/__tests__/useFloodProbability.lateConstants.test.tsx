import { act, renderHook } from "@testing-library/react-native";

import CONSTANTS_FIXTURE from "@services/floodPrediction/__tests__/fixtures/floodPredictionConstants.json";
import {
  __resetConstantsForTest,
  __setConstantsForTest,
} from "@services/floodPrediction/constantsSource";
import { getFloodProbability } from "@services/floodPrediction/floodPredictionService";

import { useFloodProbability } from "../useFloodProbability";

jest.mock("@models/helpers/useStores", () => ({
  useStores: () => ({
    gagesStore: { getGageByLocationId: () => null },
    getTimezone: () => "America/Los_Angeles",
  }),
}));

jest.mock("@services/floodPrediction/floodPredictionService", () => {
  const actual = jest.requireActual("@services/floodPrediction/floodPredictionService");
  return { ...actual, getFloodProbability: jest.fn(() => Promise.resolve(null)) };
});

// A duck-typed gauge with only the fields the hook reads. SVPA-25 is covered
// through the constants (not through the bundled direct-gauge registry), so it
// is invisible to the hook until the constants land.
const gage = {
  locationId: "SVPA-25",
  redStage: 66.51,
  riverMile: 20,
  status: {},
  readings: [],
} as never;

beforeEach(() => {
  __resetConstantsForTest();
  (getFloodProbability as jest.Mock).mockClear();
});

afterEach(() => {
  __resetConstantsForTest();
});

describe("useFloodProbability when constants arrive after first render", () => {
  it("requests the forecast once the constants land", () => {
    const { result, rerender } = renderHook(() => useFloodProbability(gage));

    // Nothing loaded yet: the gauge looks uncovered and no fetch is made.
    expect(result.current).toBeNull();
    expect(getFloodProbability).not.toHaveBeenCalled();

    // The constants land. In the app a mobx `observer` re-renders on the box
    // write; here we drive that re-render by hand. The effect must then re-run,
    // which only happens if `constants` is in its dependency array.
    act(() => {
      __setConstantsForTest(CONSTANTS_FIXTURE);
    });
    rerender({});

    expect(getFloodProbability).toHaveBeenCalledWith("SVPA-25", undefined);
  });
});
