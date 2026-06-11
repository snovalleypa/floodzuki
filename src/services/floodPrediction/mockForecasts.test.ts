import { DebugFlag, getDebugFlag } from "@utils/debugFlags";

import { computeFloodProbability } from "./calculations";
import { getMockMapQuantiles } from "./mockForecasts";

jest.mock("@utils/debugFlags", () => {
  const actual = jest.requireActual("@utils/debugFlags");
  return { ...actual, getDebugFlag: jest.fn() };
});

const mockedGetDebugFlag = getDebugFlag as jest.Mock;

describe("getMockMapQuantiles", () => {
  afterEach(() => mockedGetDebugFlag.mockReset());

  it("returns null when no mock flag is active", () => {
    mockedGetDebugFlag.mockReturnValue(false);
    expect(getMockMapQuantiles("CRNW1")).toBeNull();
  });

  it("anchors the median (0.5) flow on the observed event peak", () => {
    mockedGetDebugFlag.mockImplementation((f) => f === DebugFlag.MockFloodJan2022);
    const q = getMockMapQuantiles("CRNW1");
    expect(q).not.toBeNull();
    // EXCEEDANCES index 3 is the 0.5 exceedance = Jan 21 Carnation peak.
    expect(q!.exceedanceQuantiles[3]).toBe(0.5);
    expect(q!.flowsByWindow[5][3]).toBe(20100);
    expect(q!.flowsByWindow[10][3]).toBe(20100);
  });

  it("returns null for a site that isn't modeled", () => {
    mockedGetDebugFlag.mockImplementation((f) => f === DebugFlag.MockFloodJan2022);
    expect(getMockMapQuantiles("XXXX")).toBeNull();
  });

  it("the March 2022 mock floods a high-threshold gauge (p99 = 55.42)", () => {
    mockedGetDebugFlag.mockImplementation((f) => f === DebugFlag.MockFloodMarch2022);
    const quantiles = getMockMapQuantiles("CRNW1")!;
    // Minimal Carnation rating bracketing the mock flows; height climbs with flow.
    const ratingTable = [
      { gageHeight: 50, discharge: 10000 },
      { gageHeight: 56, discharge: 35000 },
      { gageHeight: 62, discharge: 60000 },
    ];
    const r = computeFloodProbability({ p99: 55.42, quantiles, ratingTable });
    expect(r.isLow).toBe(false);
    expect(r.probability).not.toBeNull();
  });
});
