import { computeForecastSeverity } from "../regionSummary";

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
