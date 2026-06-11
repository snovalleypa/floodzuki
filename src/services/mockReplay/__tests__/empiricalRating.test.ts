// src/services/mockReplay/__tests__/empiricalRating.test.ts
import { buildEmpiricalRating } from "../empiricalRating";
import { RawReading } from "../types";

const r = (waterDischarge: number, waterHeight: number): RawReading => ({
  timestampMs: 0,
  waterDischarge,
  waterHeight,
});

describe("buildEmpiricalRating", () => {
  it("interpolates linearly between observed (discharge, height) pairs", () => {
    const rating = buildEmpiricalRating([r(1000, 10), r(2000, 12)]);
    expect(rating.flowToHeight(1500)).toBeCloseTo(11, 5);
  });

  it("clamps below the lowest and above the highest observed discharge", () => {
    const rating = buildEmpiricalRating([r(1000, 10), r(2000, 12)]);
    expect(rating.flowToHeight(0)).toBe(10);
    expect(rating.flowToHeight(9999)).toBe(12);
  });

  it("sorts unsorted input and tolerates duplicate discharges", () => {
    const rating = buildEmpiricalRating([r(2000, 12), r(1000, 10), r(1000, 10)]);
    expect(rating.flowToHeight(1500)).toBeCloseTo(11, 5);
  });

  it("ignores readings missing discharge or height", () => {
    const rating = buildEmpiricalRating([
      { timestampMs: 0, waterDischarge: 1000 },
      r(1000, 10),
      r(2000, 12),
    ]);
    expect(rating.flowToHeight(1500)).toBeCloseTo(11, 5);
  });
});
