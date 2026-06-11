// src/services/mockReplay/__tests__/engine.init.test.ts
import localDayJs from "@services/localDayJs";
import * as engine from "../engine";
import { __resetMockReplayForTest } from "../mockReplayState";

const TZ = "America/Los_Angeles";

const scenario = {
  id: "x",
  label: "x",
  mockNow: "2022-03-01T06:00:00",
  forecastAgeHours: 18,
  forecastDeviationPct: 0,
};

describe("engine.init", () => {
  beforeEach(() => {
    engine.__resetEngineForTest();
    __resetMockReplayForTest();
  });

  it("is not initialized before init", () => {
    expect(engine.isInitialized()).toBe(false);
    expect(engine.isActive()).toBe(false);
  });

  it("captures an anchor and preloads readings per gauge", async () => {
    const mockNowMs = localDayJs.tz("2022-03-01T06:00:00", "YYYY-MM-DDTHH:mm:ss", TZ).valueOf();
    const fetchRawReadings = jest.fn().mockResolvedValue([
      { timestampMs: mockNowMs - 3_600_000, waterHeight: 10, waterDischarge: 1000 },
      { timestampMs: mockNowMs, waterHeight: 10.5, waterDischarge: 1100 },
    ]);

    await engine.init({
      scenario,
      timezone: TZ,
      nowMs: mockNowMs + 1000, // pretend the app started 1s of wall-time later
      locationIds: ["USGS-22"],
      forecastGageIds: [],
      stagesByLocation: { "USGS-22": { yellowStage: 12.5, redStage: 13.5 } },
      fetchRawReadings,
    });

    expect(engine.isInitialized()).toBe(true);
    expect(fetchRawReadings).toHaveBeenCalledWith(
      "USGS-22",
      expect.any(Number),
      expect.any(Number)
    );
    // effectiveMockNow at start ≈ mockNow (within the 1s wall offset).
    expect(engine.effectiveMockNowMs(mockNowMs + 1000)).toBe(mockNowMs);
  });

  it("does not recurse: isPreloading is true only during the fetch", async () => {
    const mockNowMs = localDayJs.tz("2022-03-01T06:00:00", "YYYY-MM-DDTHH:mm:ss", TZ).valueOf();
    let seenDuringFetch = false;
    const fetchRawReadings = jest.fn().mockImplementation(async () => {
      seenDuringFetch = engine.isPreloading();
      return [];
    });
    await engine.init({
      scenario,
      timezone: TZ,
      nowMs: mockNowMs,
      locationIds: ["USGS-22"],
      forecastGageIds: [],
      stagesByLocation: {},
      fetchRawReadings,
    });
    expect(seenDuringFetch).toBe(true);
    expect(engine.isPreloading()).toBe(false);
  });
});
