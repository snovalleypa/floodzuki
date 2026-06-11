import { selectObservedPredictorStage } from "./observedFloodProbability";

const TZ = "America/Los_Angeles";

// Hourly readings, newest-first, around a crest. Latest = 12:00 @ 50ft.
const READINGS = [
  { timestamp: "2026-01-21T12:00:00", waterHeight: 50 },
  { timestamp: "2026-01-21T11:00:00", waterHeight: 52 },
  { timestamp: "2026-01-21T06:00:00", waterHeight: 55 }, // within 8h of 12:00
  { timestamp: "2026-01-21T02:00:00", waterHeight: 60 }, // 10h before 12:00 -> outside 8h
];

const base = {
  gaugeRiverMile: 34,
  gaugeTrendValue: 0.1,
  predictorRiverMile: 38,
  predictorTrendValue: 0,
  predictorCurrentHeight: 50,
  predictorReadings: READINGS,
  timezone: TZ,
};

describe("selectObservedPredictorStage", () => {
  it("returns null when the evaluated gauge is falling", () => {
    expect(selectObservedPredictorStage({ ...base, gaugeTrendValue: -0.05 })).toBeNull();
  });

  it("returns null when the predictor has no current height", () => {
    expect(selectObservedPredictorStage({ ...base, predictorCurrentHeight: null })).toBeNull();
  });

  it("uses the predictor's current value when the predictor is downstream", () => {
    // predictor (22) downstream of gauge (25)
    const r = selectObservedPredictorStage({
      ...base,
      predictorRiverMile: 22,
      gaugeRiverMile: 25,
      predictorTrendValue: -1, // ignored when downstream
    });
    expect(r).toBe(50);
  });

  it("uses the predictor's current value when upstream and rising", () => {
    const r = selectObservedPredictorStage({ ...base, predictorTrendValue: 0.2 });
    expect(r).toBe(50);
  });

  it("uses the max over the last N hours when upstream and flat/falling", () => {
    // upstream (38 > 34), flat -> N = 2*(38-34) = 8h window from 12:00 -> >= 04:00
    const r = selectObservedPredictorStage({ ...base, predictorTrendValue: 0 });
    expect(r).toBe(55); // 60 at 02:00 is outside the 8h window
  });

  it("treats falling predictor the same as flat (max over N hours)", () => {
    const r = selectObservedPredictorStage({ ...base, predictorTrendValue: -0.3 });
    expect(r).toBe(55);
  });
});
