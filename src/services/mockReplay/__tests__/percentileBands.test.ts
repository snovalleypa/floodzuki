// src/services/mockReplay/__tests__/percentileBands.test.ts
import { synthesizeBands, BAND_EXCEEDANCES } from "../percentileBands";
import { RawReading } from "../types";

const DAY = 86_400_000;

// Peak of 20000 on day 3 (inside both windows); 8000 on day 7 (inside 10-day only).
const actual: RawReading[] = [
  { timestampMs: 0, waterDischarge: 5000 },
  { timestampMs: 3 * DAY, waterDischarge: 20000 },
  { timestampMs: 7 * DAY, waterDischarge: 8000 },
];

describe("synthesizeBands", () => {
  it("anchors the 0.5 exceedance on the in-window peak per window", () => {
    const q = synthesizeBands({ actual, fromMs: 0, deviationPct: 0 });
    const mid = BAND_EXCEEDANCES.indexOf(0.5);
    expect(q.flowsByWindow[5][mid]).toBeCloseTo(20000, 5);
    expect(q.flowsByWindow[10][mid]).toBeCloseTo(20000, 5);
  });

  it("orders flows descending with exceedance (rarer = higher flow)", () => {
    const q = synthesizeBands({ actual, fromMs: 0, deviationPct: 0 });
    const flows = q.flowsByWindow[5];
    for (let i = 1; i < flows.length; i++) {
      expect(flows[i]).toBeLessThanOrEqual(flows[i - 1]);
    }
  });

  it("amplifies the rise from current to peak by the deviation percent", () => {
    const base = synthesizeBands({ actual, fromMs: 0, deviationPct: 0 });
    const amped = synthesizeBands({ actual, fromMs: 0, deviationPct: 10 });
    const mid = BAND_EXCEEDANCES.indexOf(0.5);
    // current 5000, peak 20000 → rise 15000; +10% → 16500 → peak 21500.
    expect(amped.flowsByWindow[5][mid]).toBeGreaterThan(base.flowsByWindow[5][mid]);
    expect(amped.flowsByWindow[5][mid]).toBeCloseTo(21500, 5);
  });
});
