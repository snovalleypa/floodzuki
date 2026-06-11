// src/services/mockReplay/__tests__/engine.bands.test.ts
import localDayJs from "@services/localDayJs";
import * as engine from "../engine";

const TZ = "America/Los_Angeles";
const HOUR = 3_600_000;
const DAY = 86_400_000;

describe("engine.buildMapQuantiles", () => {
  it("returns null for an unknown predictor site", () => {
    engine.__resetEngineForTest();
    expect(engine.buildMapQuantiles("ZZZZ")).toBeNull();
  });

  it("synthesizes bands from the cached predictor gauge's peak", async () => {
    engine.__resetEngineForTest();
    const mockNowMs = localDayJs.tz("2022-03-01T06:00:00", "YYYY-MM-DDTHH:mm:ss", TZ).valueOf();
    const readings = Array.from({ length: 24 * 12 }, (_, i) => ({
      timestampMs: mockNowMs - DAY + i * HOUR,
      waterDischarge: 5000 + (i === 50 ? 20000 : i * 10),
      waterHeight: 10,
    }));
    // CRNW1 -> USGS-22 (Carnation) per floodPredictionConstants predictors.
    await engine.init({
      scenario: {
        id: "x",
        label: "x",
        mockNow: "2022-03-01T06:00:00",
        forecastAgeHours: 18,
        forecastDeviationPct: 0,
      },
      timezone: TZ,
      nowMs: mockNowMs,
      locationIds: ["USGS-22"],
      forecastGageIds: [],
      stagesByLocation: {},
      fetchRawReadings: async () => readings,
    });
    const q = engine.buildMapQuantiles("CRNW1", mockNowMs);
    expect(q).not.toBeNull();
    expect(q!.flowsByWindow[5].length).toBe(q!.exceedanceQuantiles.length);
  });
});
