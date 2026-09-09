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
    // Readings are newest-first; readings[0] display time is within a step of wall-now.
    const latestTs = localDayJs
      .tz(shape.readings[0].timestamp, "YYYY-MM-DDTHH:mm:ss", TZ)
      .valueOf();
    expect(Math.abs(latestTs - nowMs)).toBeLessThan(2 * HOUR);
    expect(shape.status?.floodLevel).toBeDefined();
    // predictions = 6h trend nowcast at 15-min steps (excludes the anchor) → 24 points.
    expect(shape.predictions.length).toBe(24);
    const p0 = localDayJs.tz(shape.predictions[0].timestamp, "YYYY-MM-DDTHH:mm:ss", TZ).valueOf();
    const p1 = localDayJs.tz(shape.predictions[1].timestamp, "YYYY-MM-DDTHH:mm:ss", TZ).valueOf();
    expect(p1 - p0).toBe(15 * 60 * 1000);
  });

  it("buildStatusAndRecentReadings returns one entry per location id", async () => {
    const { mockNowMs } = await setup();
    const shape = engine.buildStatusAndRecentReadings(["USGS-22"], mockNowMs);
    expect(shape.gages).toHaveLength(1);
    expect(shape.gages[0].locationId).toBe("USGS-22");
    expect(shape.gages[0].status.floodLevel).toBeDefined();
  });

  it("buildV2Forecasts produces a prediction series with a crest peak per gage id", async () => {
    const { mockNowMs } = await setup();
    const shape = engine.buildV2Forecasts(["USGS-22"], mockNowMs);
    expect(shape["USGS-22"].timestamps.length).toBeGreaterThan(0);
    expect(shape["USGS-22"].waterHeights.length).toBe(shape["USGS-22"].timestamps.length);
    // Forecasted crest is populated (not null) and has one peak point.
    expect(shape["USGS-22"].peaks).not.toBeNull();
    expect(shape["USGS-22"].peaks.discharges.length).toBe(1);
    expect(shape["USGS-22"].peaks.discharges[0]).toBeGreaterThan(0);
  });

  it("buildV2Readings produces recent-reading arrays per gage id", async () => {
    const { mockNowMs } = await setup();
    const shape = engine.buildV2Readings(["USGS-22"], mockNowMs);
    expect(shape.readings["USGS-22"].timestamps.length).toBeGreaterThan(0);
  });

  it("rounds emitted feet to 2 decimals and flow to whole CFS", async () => {
    const { mockNowMs } = await setup();
    // Raw fixture stages (10 + i*0.002) and the synthesized forecast/nowcast carry
    // more than 2 decimals before rounding; flow must be whole numbers.
    const has2dp = (n: number) => Math.abs(n * 100 - Math.round(n * 100)) < 1e-9;
    const isInt = (n: number) => Number.isInteger(n);

    const gr = engine.buildGageReadings("USGS-22", mockNowMs);
    gr.readings.forEach((r) => {
      expect(has2dp(r.waterHeight as number)).toBe(true);
      expect(isInt(r.waterDischarge as number)).toBe(true);
    });
    gr.predictions.forEach((p) => {
      expect(has2dp(p.waterHeight as number)).toBe(true);
      expect(isInt(p.waterDischarge as number)).toBe(true);
    });
    expect(has2dp(gr.status!.lastReading!.waterHeight as number)).toBe(true);
    expect(isInt(gr.status!.lastReading!.waterDischarge as number)).toBe(true);

    const fc = engine.buildV2Forecasts(["USGS-22"], mockNowMs)["USGS-22"];
    fc.waterHeights.forEach((h: number) => expect(has2dp(h)).toBe(true));
    fc.discharges.forEach((d: number) => expect(isInt(d)).toBe(true));
    expect(isInt(fc.peaks.discharges[0])).toBe(true);
    expect(has2dp(fc.peaks.waterHeights[0])).toBe(true);
  });
});
