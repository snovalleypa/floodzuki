// src/services/mockReplay/__tests__/status.test.ts
import { computeStatus, computeTrendRates } from "../status";
import { RawReading } from "../types";

const reading = (timestampMs: number, h: number, q?: number): RawReading => ({
  timestampMs,
  waterHeight: h,
  waterDischarge: q,
});

const HOUR = 3_600_000;

describe("computeStatus", () => {
  it("flags Flooding at or above red stage", () => {
    const s = computeStatus({
      readings: [reading(0, 13.6)],
      yellowStage: 12.5,
      redStage: 13.5,
    });
    expect(s.floodLevel).toBe("Flooding");
  });

  it("flags NearFlooding between yellow and red", () => {
    const s = computeStatus({
      readings: [reading(0, 12.6)],
      yellowStage: 12.5,
      redStage: 13.5,
    });
    expect(s.floodLevel).toBe("NearFlooding");
  });

  it("flags Normal below yellow stage", () => {
    const s = computeStatus({
      readings: [reading(0, 9)],
      yellowStage: 12.5,
      redStage: 13.5,
    });
    expect(s.floodLevel).toBe("Normal");
  });

  it("reports Rising / Falling / Steady from the last delta", () => {
    const rising = computeStatus({
      readings: [reading(0, 10), reading(HOUR, 10.5)],
    });
    expect(rising.levelTrend).toBe("Rising");
    expect(rising.waterTrend.trendValue).toBeCloseTo(0.5, 5);

    const falling = computeStatus({ readings: [reading(0, 10), reading(HOUR, 9.5)] });
    expect(falling.levelTrend).toBe("Falling");

    const steady = computeStatus({ readings: [reading(0, 10), reading(HOUR, 10.005)] });
    expect(steady.levelTrend).toBe("Steady");
  });

  it("keeps at most four trend deltas, most-recent last", () => {
    const s = computeStatus({
      readings: [0, 1, 2, 3, 4, 5].map((i) => reading(i * HOUR, 10 + i)),
    });
    expect(s.waterTrend.trendValues).toHaveLength(4);
  });

  it("is Offline with no readings", () => {
    const s = computeStatus({ readings: [] });
    expect(s.floodLevel).toBe("Offline");
  });
});

describe("computeTrendRates", () => {
  it("derives ft/hr and cfs/hr from the last three readings", () => {
    const points = [reading(0, 10, 1000), reading(HOUR, 10.5, 1100), reading(2 * HOUR, 11, 1200)];
    const rates = computeTrendRates(points);
    expect(rates.feetPerHour).toBeCloseTo(0.5, 5);
    expect(rates.cfsPerHour).toBeCloseTo(100, 5);
  });
});
