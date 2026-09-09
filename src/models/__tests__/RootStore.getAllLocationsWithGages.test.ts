import { RootStoreModel } from "@models/RootStore";

describe("RootStore.getAllLocationsWithGages", () => {
  const buildStore = () =>
    RootStoreModel.create({
      showHiddenOffline: false,
      locationInfoStore: {
        locationInfos: [
          { id: "USGS-38" },
          { id: "SVPA-29" }, // hidden: no backing real gage
          { id: "USGS-22" },
        ] as any,
      },
      gagesStore: {
        gages: [
          { locationId: "USGS-38", _isStub: false },
          { locationId: "USGS-22", _isStub: false },
        ] as any,
      },
    });

  it("returns the real gages in locationInfo (river) order", () => {
    const store = buildStore();
    expect(store.getAllLocationsWithGages().map((g) => g!.locationId)).toEqual([
      "USGS-38",
      "USGS-22",
    ]);
  });

  it("includes a hidden-location stub regardless of the visibility toggle", () => {
    const store = buildStore();
    // Materialize the SVPA-29 stub without flipping the user's toggle.
    store.gagesStore.syncHiddenStubs(true, store.locationInfoStore.locationInfos);

    // getAllLocationsWithGages surfaces the stub, in order...
    expect(store.getAllLocationsWithGages().map((g) => g!.locationId)).toEqual([
      "USGS-38",
      "SVPA-29",
      "USGS-22",
    ]);
    // ...while the toggle-gated gauge-list view still hides it (toggle is off).
    expect(store.showHiddenOffline).toBe(false);
    expect(store.getLocationsWithGages().map((g) => g!.locationId)).toEqual(["USGS-38", "USGS-22"]);
  });
});
