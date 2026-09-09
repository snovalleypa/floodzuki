import { RootStoreModel } from "@models/RootStore";
import Config from "@config/config";
import { loadFloodPredictionConstants } from "@services/floodPrediction/constantsSource";
import { getActiveScenario } from "@services/mockReplay/mockReplayState";

// Isolates the boot-wiring assertion from the real sub-store fetches (network
// calls) and from the mock-replay branch.
jest.mock("@services/floodPrediction/constantsSource", () => ({
  loadFloodPredictionConstants: jest.fn(),
}));

jest.mock("@services/mockReplay/mockReplayState", () => ({
  getActiveScenario: jest.fn(() => null),
}));

function buildStoreWithMockedSubFetches() {
  const store = RootStoreModel.create({});
  jest.spyOn(store.regionStore, "fetchData").mockResolvedValue(undefined as never);
  jest.spyOn(store.locationInfoStore, "fetchData").mockResolvedValue(undefined as never);
  jest.spyOn(store.gagesStore, "fetchData").mockResolvedValue(undefined as never);
  jest.spyOn(store.forecastsStore, "fetchData").mockResolvedValue(undefined as never);
  return store;
}

describe("RootStore.fetchMainData — flood-prediction constants boot wiring (finding 3)", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("kicks off the constants load for the configured region, and boot does not wait on it", async () => {
    // Never resolves: if fetchMainData ever awaited/yielded this call instead of
    // firing it with `void`, this test would hang until Jest's per-test timeout
    // and fail — proving the boot sequence does not block on it.
    (loadFloodPredictionConstants as jest.Mock).mockReturnValue(new Promise<void>(() => {}));

    const store = buildStoreWithMockedSubFetches();

    await store.fetchMainData();

    expect(loadFloodPredictionConstants).toHaveBeenCalledTimes(1);
    expect(loadFloodPredictionConstants).toHaveBeenCalledWith(Config.SVPA_REGION_ID);
    // fetchMainData resolved (isFetched flipped) even though the loader's promise
    // above is still unsettled.
    expect(store.isDataFetched).toBe(true);
    expect(getActiveScenario).toHaveBeenCalled();
  });
});
