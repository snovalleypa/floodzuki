// src/services/mockReplay/__tests__/engine.metagage.test.ts
import localDayJs from "@services/localDayJs";
import * as engine from "../engine";

const TZ = "America/Los_Angeles";
const HOUR = 3_600_000;

const METAGAGE = "USGS-A/USGS-B";

async function setup() {
  engine.__resetEngineForTest();
  const mockNowMs = localDayJs.tz("2022-03-01T06:00:00", "YYYY-MM-DDTHH:mm:ss", TZ).valueOf();
  // Two component gauges, each a flat discharge series at a known level.
  const series = (q: number) =>
    Array.from({ length: 24 * 30 }, (_, i) => ({
      timestampMs: mockNowMs - 20 * 24 * HOUR + i * HOUR,
      waterDischarge: q,
      waterHeight: 5,
    }));
  const byId: Record<string, ReturnType<typeof series>> = {
    "USGS-A": series(1000),
    "USGS-B": series(3000),
  };
  await engine.init({
    scenario: {
      id: "x",
      label: "x",
      mockNow: "2022-03-01T06:00:00",
      forecastAgeHours: 6,
      forecastDeviationPct: 0,
    },
    timezone: TZ,
    nowMs: mockNowMs,
    locationIds: [],
    forecastGageIds: [METAGAGE],
    stagesByLocation: {},
    fetchRawReadings: async (id) => byId[id] ?? [],
  });
  return { mockNowMs };
}

describe("engine metagage (sum of components)", () => {
  it("sums component discharges into the metagage cache", async () => {
    const { mockNowMs } = await setup();
    const v2 = engine.buildV2Readings([METAGAGE], mockNowMs);
    const discharges = v2.readings[METAGAGE].discharges;
    expect(discharges.length).toBeGreaterThan(0);
    // 1000 + 3000 = 4000 at every point.
    expect(discharges[0]).toBeCloseTo(4000, 5);
  });

  it("produces a forecast series for the metagage", async () => {
    const { mockNowMs } = await setup();
    const fc = engine.buildV2Forecasts([METAGAGE], mockNowMs);
    expect(fc[METAGAGE].discharges.length).toBeGreaterThan(0);
    expect(fc[METAGAGE].discharges[0]).toBeCloseTo(4000, 5);
  });
});
