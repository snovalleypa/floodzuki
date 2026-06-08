import { RootStoreModel } from "@models/RootStore";
import { setupRootStore } from "../setupRootStore";

// Storage layer is mocked so we can hand setupRootStore an exact snapshot.
jest.mock("@utils/storage", () => ({
  load: jest.fn(),
  save: jest.fn().mockResolvedValue(true),
}));

// setupRootStore calls api.setHeader when an auth token is present. Stub it.
jest.mock("@services/api", () => ({
  api: {
    setHeader: jest.fn(),
    removeHeader: jest.fn(),
  },
}));

// Locale plumbing — irrelevant to this test but imported by setupRootStore.
// AuthSession.ts also imports { i18n } and reads i18n.locale at model-definition time.
jest.mock("@i18n/i18n", () => ({ changeLocale: jest.fn(), i18n: { locale: "en" } }));
jest.mock("@services/localDayJs", () => ({
  __esModule: true,
  default: { locale: jest.fn() },
}));

const { load } = jest.requireMock("@utils/storage") as { load: jest.Mock };

describe("setupRootStore stub rehydration", () => {
  beforeEach(() => {
    load.mockReset();
  });

  it("repopulates stubs for hidden locations when showHiddenOffline rehydrates as true", async () => {
    // Snapshot mimicking a session that ended with the toggle ON. Stubs were stripped
    // during persist (postProcessSnapshot), so only real gauges are present.
    load.mockResolvedValueOnce({
      isFetched: false,
      showHiddenOffline: true,
      gagesStore: {
        gages: [
          { locationId: "USGS-38", _isStub: false },
          { locationId: "USGS-22", _isStub: false },
        ],
      },
      locationInfoStore: {
        locationInfos: [
          { id: "USGS-38" },
          { id: "SVPA-29" }, // hidden — no corresponding real gauge
          { id: "USGS-22" },
          { id: "SVPA-25" }, // hidden — no corresponding real gauge
        ],
      },
    });

    const rootStore = RootStoreModel.create({});
    await setupRootStore(rootStore);

    const locationIds = rootStore.gagesStore.gages.map((g) => g.locationId).sort();
    expect(locationIds).toEqual(["SVPA-25", "SVPA-29", "USGS-22", "USGS-38"]);

    const svpa29 = rootStore.gagesStore.gages.find((g) => g.locationId === "SVPA-29");
    expect(svpa29?._isStub).toBe(true);

    // The list the gauge details screen consumes — must include hidden locations
    // in locationInfos order, so initialIndex doesn't shift after fetchData runs.
    expect(rootStore.getLocationWithGagesIds()).toEqual([
      "USGS-38",
      "SVPA-29",
      "USGS-22",
      "SVPA-25",
    ]);
  });

  it("does not add stubs when showHiddenOffline rehydrates as false", async () => {
    load.mockResolvedValueOnce({
      isFetched: false,
      showHiddenOffline: false,
      gagesStore: {
        gages: [
          { locationId: "USGS-38", _isStub: false },
          { locationId: "USGS-22", _isStub: false },
        ],
      },
      locationInfoStore: {
        locationInfos: [{ id: "USGS-38" }, { id: "SVPA-29" }, { id: "USGS-22" }],
      },
    });

    const rootStore = RootStoreModel.create({});
    await setupRootStore(rootStore);

    expect(rootStore.gagesStore.gages.map((g) => g.locationId).sort()).toEqual([
      "USGS-22",
      "USGS-38",
    ]);
  });
});
