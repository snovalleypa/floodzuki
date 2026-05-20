import {
  computeForecastSeverity,
  computeBucketCounts,
  computeStubChanges,
  makeStubSnapshot,
} from "../regionSummary";

describe("computeForecastSeverity", () => {
  it("returns 'none' for an empty input", () => {
    expect(computeForecastSeverity([])).toBe("none");
  });

  it("returns 'none' when all peaks are below stageOne", () => {
    expect(
      computeForecastSeverity([
        { peaks: [{ waterDischarge: 100 }], dischargeStageOne: 500, dischargeStageTwo: 1000 },
      ])
    ).toBe("none");
  });

  it("returns 'near' when a peak is at or above stageOne but below stageTwo", () => {
    expect(
      computeForecastSeverity([
        { peaks: [{ waterDischarge: 500 }], dischargeStageOne: 500, dischargeStageTwo: 1000 },
      ])
    ).toBe("near");
  });

  it("returns 'flood' when any peak is at or above stageTwo", () => {
    expect(
      computeForecastSeverity([
        { peaks: [{ waterDischarge: 1000 }], dischargeStageOne: 500, dischargeStageTwo: 1000 },
      ])
    ).toBe("flood");
  });

  it("returns 'flood' when one forecast is near and another is flood", () => {
    expect(
      computeForecastSeverity([
        { peaks: [{ waterDischarge: 600 }], dischargeStageOne: 500, dischargeStageTwo: 1000 },
        { peaks: [{ waterDischarge: 1500 }], dischargeStageOne: 500, dischargeStageTwo: 1000 },
      ])
    ).toBe("flood");
  });

  it("skips peaks with null waterDischarge", () => {
    expect(
      computeForecastSeverity([
        {
          peaks: [{ waterDischarge: null }, { waterDischarge: 1500 }],
          dischargeStageOne: 500,
          dischargeStageTwo: 1000,
        },
      ])
    ).toBe("flood");
  });

  it("returns 'none' when thresholds are missing or zero", () => {
    expect(computeForecastSeverity([{ peaks: [{ waterDischarge: 9999 }] }])).toBe("none");
    expect(
      computeForecastSeverity([
        { peaks: [{ waterDischarge: 9999 }], dischargeStageOne: 0, dischargeStageTwo: 0 },
      ])
    ).toBe("none");
  });
});

describe("computeBucketCounts", () => {
  const loc = (id: string, isMetagage = false) => ({ id, isMetagage });
  const gage = (locationId: string, floodLevel = "Normal", isStub = false) => ({
    locationId,
    _isStub: isStub,
    gageStatus: { floodLevel },
  });

  it("counts a fleet of all-normal gauges as fully active", () => {
    expect(
      computeBucketCounts({
        gages: [gage("A"), gage("B")],
        locationInfos: [loc("A"), loc("B")],
      })
    ).toEqual({ active: 2, visibleOffline: 0, hidden: 0, flooding: 0, nearFlooding: 0 });
  });

  it("separates active / visible-offline by floodLevel", () => {
    expect(
      computeBucketCounts({
        gages: [gage("A", "Normal"), gage("B", "Offline"), gage("C", "Flooding")],
        locationInfos: [loc("A"), loc("B"), loc("C")],
      })
    ).toEqual({ active: 2, visibleOffline: 1, hidden: 0, flooding: 1, nearFlooding: 0 });
  });

  it("counts flooding and nearFlooding levels", () => {
    expect(
      computeBucketCounts({
        gages: [
          gage("A", "Flooding"),
          gage("B", "Flooding"),
          gage("C", "NearFlooding"),
          gage("D", "Normal"),
        ],
        locationInfos: [loc("A"), loc("B"), loc("C"), loc("D")],
      })
    ).toEqual({ active: 4, visibleOffline: 0, hidden: 0, flooding: 2, nearFlooding: 1 });
  });

  it("counts hidden locations (in locationInfos but not in gages)", () => {
    expect(
      computeBucketCounts({
        gages: [gage("A")],
        locationInfos: [loc("A"), loc("B"), loc("C")],
      })
    ).toEqual({ active: 1, visibleOffline: 0, hidden: 2, flooding: 0, nearFlooding: 0 });
  });

  it("excludes stubs from active / visible-offline / flood counts", () => {
    expect(
      computeBucketCounts({
        gages: [gage("A", "Normal"), gage("B", "Flooding", /* isStub */ true)],
        locationInfos: [loc("A"), loc("B")],
      })
    ).toEqual({ active: 1, visibleOffline: 0, hidden: 1, flooding: 0, nearFlooding: 0 });
  });

  it("excludes metagages from the hidden count", () => {
    expect(
      computeBucketCounts({
        gages: [gage("A")],
        locationInfos: [loc("A"), loc("META/AGE", true)],
      })
    ).toEqual({ active: 1, visibleOffline: 0, hidden: 0, flooding: 0, nearFlooding: 0 });
  });
});

describe("computeStubChanges", () => {
  const loc = (id: string, isMetagage = false) => ({ id, isMetagage });
  const real = (locationId: string) => ({ locationId, _isStub: false });
  const stub = (locationId: string) => ({ locationId, _isStub: true });

  it("removes all stubs when showHidden is false", () => {
    expect(
      computeStubChanges({
        gages: [real("A"), stub("B"), stub("C")],
        locationInfos: [loc("A"), loc("B"), loc("C")],
        showHidden: false,
      })
    ).toEqual({ toAdd: [], toRemove: ["B", "C"] });
  });

  it("adds stubs for hidden locations when showHidden is true", () => {
    expect(
      computeStubChanges({
        gages: [real("A")],
        locationInfos: [loc("A"), loc("B"), loc("C")],
        showHidden: true,
      })
    ).toEqual({ toAdd: ["B", "C"], toRemove: [] });
  });

  it("removes stale stubs whose locationId is now in real gages", () => {
    expect(
      computeStubChanges({
        gages: [real("A"), stub("A")],
        locationInfos: [loc("A")],
        showHidden: true,
      })
    ).toEqual({ toAdd: [], toRemove: ["A"] });
  });

  it("skips metagage locations when building stubs", () => {
    expect(
      computeStubChanges({
        gages: [],
        locationInfos: [loc("A"), loc("META/AGE", true)],
        showHidden: true,
      })
    ).toEqual({ toAdd: ["A"], toRemove: [] });
  });

  it("is idempotent — second call with the synced result produces no changes", () => {
    const first = computeStubChanges({
      gages: [real("A")],
      locationInfos: [loc("A"), loc("B")],
      showHidden: true,
    });
    expect(first).toEqual({ toAdd: ["B"], toRemove: [] });

    const synced = [real("A"), stub("B")];
    const second = computeStubChanges({
      gages: synced,
      locationInfos: [loc("A"), loc("B")],
      showHidden: true,
    });
    expect(second).toEqual({ toAdd: [], toRemove: [] });
  });
});

describe("makeStubSnapshot", () => {
  it("returns a minimal snapshot suitable for GageStore.gages.push", () => {
    expect(makeStubSnapshot("USGS-23")).toEqual({
      locationId: "USGS-23",
      locationInfo: "USGS-23",
      isOffline: true,
      _isStub: true,
    });
  });
});
