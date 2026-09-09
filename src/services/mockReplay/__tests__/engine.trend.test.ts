// src/services/mockReplay/__tests__/engine.trend.test.ts
import localDayJs from "@services/localDayJs";
import * as engine from "../engine";

const TZ = "America/Los_Angeles";
const HOUR = 3_600_000;
const MIN = 60_000;
const ID = "USGS-22";

// Hourly readings from 30d before mockNow up to (mockNow - lagHours). Lets us
// place each gauge's most recent reading a controllable distance behind "now".
async function setupWithLag(lagHours: number) {
  engine.__resetEngineForTest();
  const mockNowMs = localDayJs.tz("2022-03-01T06:00:00", "YYYY-MM-DDTHH:mm:ss", TZ).valueOf();
  const readings = [];
  for (let k = 30 * 24; k >= lagHours; k--) {
    readings.push({
      timestampMs: mockNowMs - k * HOUR,
      waterHeight: 10 + (720 - k) * 0.001,
      waterDischarge: 1000 + (720 - k),
    });
  }
  await engine.init({
    scenario: {
      id: "x",
      label: "x",
      mockNow: "2022-03-01T06:00:00",
      forecastAgeHours: 6,
      forecastDeviationPct: 0,
    },
    timezone: TZ,
    nowMs: mockNowMs, // session start → effectiveMockNow == mockNow, delta 0
    locationIds: [ID],
    forecastGageIds: [ID],
    stagesByLocation: { [ID]: { yellowStage: 12, redStage: 14 } },
    fetchRawReadings: async () => readings,
  });
  return { mockNowMs };
}

const parse = (s: string) => localDayJs.tz(s, "YYYY-MM-DDTHH:mm:ss", TZ).valueOf();

describe("engine trend nowcast — lag & staleness", () => {
  it("anchors the first prediction 15 min after the gauge's last reading, not after mockNow", async () => {
    const { mockNowMs } = await setupWithLag(1); // last reading is 1h behind mockNow
    const shape = engine.buildGageReadings(ID, mockNowMs);

    expect(shape.predictions.length).toBe(24);
    // First point = lastReading (mockNow - 1h) + 15min — NOT mockNow + 15min.
    expect(parse(shape.predictions[0].timestamp)).toBe(mockNowMs - HOUR + 15 * MIN);
    expect(parse(shape.predictions[0].timestamp)).not.toBe(mockNowMs + 15 * MIN);
    expect(shape.status?.floodLevel).not.toBe("Offline");
  });

  it("draws no trend line and reports offline when the last reading is 2h+ stale", async () => {
    const { mockNowMs } = await setupWithLag(3); // last reading is 3h behind mockNow
    const shape = engine.buildGageReadings(ID, mockNowMs);

    // Still visible (has readings) but no trend + offline + zeroed rates.
    expect(shape.noData).toBe(false);
    expect(shape.readings.length).toBeGreaterThan(0);
    expect(shape.predictions.length).toBe(0);
    expect(shape.status?.floodLevel).toBe("Offline");
    expect(shape.predictedFeetPerHour).toBe(0);
    expect(shape.predictedCfsPerHour).toBe(0);
  });

  it("keeps a stale gauge in the dashboard list, marked offline", async () => {
    const { mockNowMs } = await setupWithLag(3);
    const shape = engine.buildStatusAndRecentReadings([ID], mockNowMs);
    expect(shape.gages).toHaveLength(1);
    expect(shape.gages[0].locationId).toBe(ID);
    expect(shape.gages[0].status.floodLevel).toBe("Offline");
  });
});
