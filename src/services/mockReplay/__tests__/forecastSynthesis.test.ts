// src/services/mockReplay/__tests__/forecastSynthesis.test.ts
import { synthesizeForecast, sampleDischargeAt } from "../forecastSynthesis";
import { buildEmpiricalRating } from "../empiricalRating";
import { RawReading } from "../types";

const HOUR = 3_600_000;
const STEP = 6 * HOUR;

// Actual discharge rising 1000 -> 1000 + 100/step over 60 steps (>10 days of 6h).
const actual: RawReading[] = Array.from({ length: 60 }, (_, i) => ({
  timestampMs: i * STEP,
  waterDischarge: 1000 + i * 100,
  waterHeight: 10 + i * 0.1,
}));
const rating = buildEmpiricalRating(actual);

describe("sampleDischargeAt", () => {
  it("interpolates discharge between readings", () => {
    expect(sampleDischargeAt(actual, STEP / 2)).toBeCloseTo(1050, 5);
  });
});

describe("synthesizeForecast", () => {
  it("starts at the actual discharge at issuance and steps every 6h for 10 days", () => {
    const points = synthesizeForecast({
      actual,
      issuanceMs: 0,
      deviationPct: 0,
      rating,
    });
    expect(points[0].discharge).toBeCloseTo(1000, 5);
    expect(points[1].timestampMs - points[0].timestampMs).toBe(STEP);
    // 10 days @ 6h = 40 intervals → 41 points.
    expect(points).toHaveLength(41);
  });

  it("reproduces the actual trajectory when deviation is 0", () => {
    const points = synthesizeForecast({ actual, issuanceMs: 0, deviationPct: 0, rating });
    expect(points[5].discharge).toBeCloseTo(1500, 5);
  });

  it("amplifies each step's change by the deviation percent", () => {
    const points = synthesizeForecast({ actual, issuanceMs: 0, deviationPct: 10, rating });
    // Each real step change is +100; at +10% it becomes +110.
    expect(points[1].discharge).toBeCloseTo(1110, 5);
    expect(points[2].discharge).toBeCloseTo(1220, 5);
  });

  it("maps discharge to stage via the rating", () => {
    const points = synthesizeForecast({ actual, issuanceMs: 0, deviationPct: 0, rating });
    expect(points[0].stage).toBeCloseTo(10, 5);
  });
});
