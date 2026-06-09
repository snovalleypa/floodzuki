import { RootStoreModel } from "@models/RootStore";

describe("RootStore.isHiddenLocation", () => {
  const buildStore = (showHiddenOffline: boolean) =>
    RootStoreModel.create({
      showHiddenOffline,
      locationInfoStore: {
        locationInfos: [
          { id: "USGS-38" },
          { id: "SVPA-29" }, // hidden when toggle off
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

  it("returns true for a known location not currently in getLocationWithGagesIds", () => {
    const store = buildStore(false);
    expect(store.isHiddenLocation("SVPA-29")).toBe(true);
  });

  it("returns false for a location that is already visible", () => {
    const store = buildStore(false);
    expect(store.isHiddenLocation("USGS-22")).toBe(false);
  });

  it("returns false for an unknown locationId — caller should still render empty state", () => {
    const store = buildStore(false);
    expect(store.isHiddenLocation("USGS-9999")).toBe(false);
  });

  it("returns false once the toggle is on and the location is included", () => {
    const store = buildStore(false);
    // Use the action (not create()) so syncHiddenStubs actually runs: it adds the
    // SVPA-29 stub, which then appears in getLocationWithGagesIds() — so the
    // !includes(...) clause is what makes this correctly return false.
    store.setShowHiddenOffline(true);
    expect(store.isHiddenLocation("SVPA-29")).toBe(false);
  });

  it("returns false for a metagage location with no backing gage (a stub is never created for it)", () => {
    const store = RootStoreModel.create({
      showHiddenOffline: false,
      locationInfoStore: {
        locationInfos: [
          { id: "USGS-38" },
          { id: "META-1", isMetagage: true }, // synthetic, never stubbed
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
    // META-1 is known and not visible, but flipping the toggle would never reveal it,
    // so isHiddenLocation must NOT report it as hidden (otherwise the screen strands on
    // EmptyComponent and the global toggle gets uselessly turned on).
    expect(store.isHiddenLocation("META-1")).toBe(false);
  });
});
