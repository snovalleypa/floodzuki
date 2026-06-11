// src/services/mockReplay/__tests__/engine.shapes.test.ts
import localDayJs from "@services/localDayJs";
import * as engine from "../engine";

const TZ = "America/Los_Angeles";
const HOUR = 3_600_000;

async function setup() {
  engine.__resetEngineForTest();
  const mockNowMs = localDayJs.tz("2022-03-01T06:00:00", "YYYY-MM-DDTHH:mm:ss", TZ).valueOf();
  // Rising readings every hour from 30 days before mockNow to 10 days after.
  const readings = Array.from({ length: 24 * 40 }, (_, i) => {
    const t = mockNowMs - 30 * 24 * HOUR + i * HOUR;
    const ramp = 1000 + i * 5;
    return { timestampMs: t, waterHeight: 10 + i * 0.002, waterDischarge: ramp };
  });
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
    forecastGageIds: ["USGS-22"],
    stagesByLocation: { "USGS-22": { yellowStage: 12, redStage: 14 } },
    fetchRawReadings: async () => readings,
  });
  return { mockNowMs };
}

describe("engine shape builders", () => {
  it("buildGageReadings returns shifted readings ending near wall-now with status & predictions", async () => {
    const { mockNowMs } = await setup();
    const nowMs = mockNowMs; // session start → effectiveMockNow == mockNow
    const shape = engine.buildGageReadings("USGS-22", nowMs);
    expect(shape.noData).toBe(false);
    // Last reading's display time is within a step of wall-now.
    const lastTs = localDayJs
      .tz(shape.readings[shape.readings.length - 1].timestamp, "YYYY-MM-DDTHH:mm:ss", TZ)
      .valueOf();
    expect(Math.abs(lastTs - nowMs)).toBeLessThan(2 * HOUR);
    expect(shape.status?.floodLevel).toBeDefined();
    expect(shape.predictions.length).toBeGreaterThan(0);
  });

  it("buildStatusAndRecentReadings returns one entry per location id", async () => {
    const { mockNowMs } = await setup();
    const shape = engine.buildStatusAndRecentReadings(["USGS-22"], mockNowMs);
    expect(shape.gages).toHaveLength(1);
    expect(shape.gages[0].locationId).toBe("USGS-22");
    expect(shape.gages[0].status.floodLevel).toBeDefined();
  });

  it("buildV2Forecasts produces a prediction series per gage id", async () => {
    const { mockNowMs } = await setup();
    const shape = engine.buildV2Forecasts(["USGS-22"], mockNowMs);
    expect(shape["USGS-22"].timestamps.length).toBeGreaterThan(0);
    expect(shape["USGS-22"].waterHeights.length).toBe(shape["USGS-22"].timestamps.length);
  });

  it("buildV2Readings produces recent-reading arrays per gage id", async () => {
    const { mockNowMs } = await setup();
    const shape = engine.buildV2Readings(["USGS-22"], mockNowMs);
    expect(shape.readings["USGS-22"].timestamps.length).toBeGreaterThan(0);
  });
});
