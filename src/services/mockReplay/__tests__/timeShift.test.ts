// src/services/mockReplay/__tests__/timeShift.test.ts
import { createAnchor, effectiveMockNow, shiftToDisplay } from "../timeShift";

describe("timeShift", () => {
  // mockNow = 1,000,000; app started ("real now") at 5,000,000 → delta 4,000,000
  const anchor = createAnchor(1_000_000, 5_000_000);

  it("delta is realNow - mockNow", () => {
    expect(anchor.delta).toBe(4_000_000);
  });

  it("effectiveMockNow equals mockNow at session start", () => {
    expect(effectiveMockNow(anchor, 5_000_000)).toBe(1_000_000);
  });

  it("effectiveMockNow advances as wall time advances", () => {
    expect(effectiveMockNow(anchor, 5_060_000)).toBe(1_060_000);
  });

  it("shiftToDisplay maps a historical instant to current wall time", () => {
    expect(shiftToDisplay(anchor, 1_000_000)).toBe(5_000_000);
  });
});
