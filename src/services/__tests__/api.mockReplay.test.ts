// src/services/__tests__/api.mockReplay.test.ts
import { api } from "@services/api";
import * as engine from "@services/mockReplay/engine";

jest.mock("@services/mockReplay/engine", () => ({
  isActive: jest.fn(),
  isPreloading: jest.fn(() => false),
  buildGageReadings: jest.fn(),
  buildStatusAndRecentReadings: jest.fn(),
  buildV2Readings: jest.fn(),
  buildV2Forecasts: jest.fn(),
}));

const mockEngine = engine as jest.Mocked<typeof engine>;

describe("api mock replay interception", () => {
  beforeEach(() => jest.clearAllMocks());

  it("serves dashboard from the engine when active", async () => {
    mockEngine.isActive.mockReturnValue(true);
    mockEngine.buildStatusAndRecentReadings.mockReturnValue({
      gages: [{ locationId: "USGS-22" }],
    } as any);
    const res = await api.getStatusAndRecentReadings("from", "to");
    expect(res.kind).toBe("ok");
    expect(mockEngine.buildStatusAndRecentReadings).toHaveBeenCalled();
  });

  it("serves live gage readings from the engine but not historical ones", async () => {
    mockEngine.isActive.mockReturnValue(true);
    mockEngine.buildGageReadings.mockReturnValue({ noData: false, readings: [] } as any);

    const live = await api.getGageReadings("USGS-22", "from", "to", undefined, true, true);
    expect(live.kind).toBe("ok");
    expect(mockEngine.buildGageReadings).toHaveBeenCalledWith("USGS-22");

    mockEngine.buildGageReadings.mockClear();
    // Historical (includePredictions=false) must NOT hit the engine.
    await api
      .getGageReadings("USGS-22", "from", "to", undefined, true, false)
      .catch(() => undefined);
    expect(mockEngine.buildGageReadings).not.toHaveBeenCalled();
  });

  it("keeps a slash metagage id intact when serving v2 readings", async () => {
    mockEngine.isActive.mockReturnValue(true);
    mockEngine.buildV2Readings.mockReturnValue({ readings: {}, maxReadingId: null } as any);
    await api.getReadings({ gageIds: "USGS-SF17/USGS-NF10/USGS-MF11,USGS-38,USGS-22" });
    expect(mockEngine.buildV2Readings).toHaveBeenCalledWith([
      "USGS-SF17/USGS-NF10/USGS-MF11",
      "USGS-38",
      "USGS-22",
    ]);
  });

  it("passes through when inactive", async () => {
    mockEngine.isActive.mockReturnValue(false);
    await api.getStatusAndRecentReadings("from", "to").catch(() => undefined);
    expect(mockEngine.buildStatusAndRecentReadings).not.toHaveBeenCalled();
  });
});
