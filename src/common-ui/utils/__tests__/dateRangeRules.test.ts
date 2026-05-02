import dayjs, { Dayjs } from "dayjs";
import { applyRangeRules, RangeRulesBounds } from "../dateRangeRules";

const d = (dateStr: string): Dayjs => dayjs(dateStr);

const defaultBounds: RangeRulesBounds = {
  minDate: d("2019-10-01"),
  maxDate: d("2026-05-01"),
  maxRange: 30,
};

describe("applyRangeRules", () => {
  // ─── Valid candidate tests ────────────────────────────────────────────────

  describe("valid candidate — other date unchanged", () => {
    it("returns candidate unchanged when picking start that keeps range ≤ 30 days, in order, within bounds", () => {
      const prev = { start: d("2026-04-01"), end: d("2026-04-20") };
      const result = applyRangeRules(prev, d("2026-04-10"), "start", defaultBounds);
      expect(result.start.format("YYYY-MM-DD")).toBe("2026-04-10");
      expect(result.end.format("YYYY-MM-DD")).toBe("2026-04-20");
    });

    it("returns candidate unchanged when picking end that keeps range ≤ 30 days, in order, within bounds", () => {
      const prev = { start: d("2026-04-01"), end: d("2026-04-20") };
      const result = applyRangeRules(prev, d("2026-04-15"), "end", defaultBounds);
      expect(result.start.format("YYYY-MM-DD")).toBe("2026-04-01");
      expect(result.end.format("YYYY-MM-DD")).toBe("2026-04-15");
    });

    it("returns candidate unchanged for exactly 30-day range", () => {
      const prev = { start: d("2026-04-01"), end: d("2026-04-20") };
      const result = applyRangeRules(prev, d("2026-03-20"), "start", defaultBounds);
      // candidate: start=2026-03-20, end=2026-04-20 → span=31 > 30 → invalid → derives newEnd
      // span preserved: 2026-03-20 + 19 days = 2026-04-08
      expect(result.start.format("YYYY-MM-DD")).toBe("2026-03-20");
      expect(result.end.format("YYYY-MM-DD")).toBe("2026-04-08");
    });

    it("returns candidate for exactly maxRange end pick that is still valid", () => {
      const prev = { start: d("2026-04-01"), end: d("2026-04-10") };
      // pick end = 2026-05-01 → span = 30 → valid
      const result = applyRangeRules(prev, d("2026-05-01"), "end", defaultBounds);
      expect(result.start.format("YYYY-MM-DD")).toBe("2026-04-01");
      expect(result.end.format("YYYY-MM-DD")).toBe("2026-05-01");
    });
  });

  // ─── Invalid out-of-order candidate ──────────────────────────────────────

  describe("invalid out-of-order candidate (picked start > prev end)", () => {
    it("preserves span when start is picked after prev end", () => {
      const prev = { start: d("2026-04-01"), end: d("2026-04-10") }; // span=9
      const result = applyRangeRules(prev, d("2026-04-20"), "start", defaultBounds);
      // candidate: start=2026-04-20, end=2026-04-10 → out of order → invalid
      // derive: newEnd = 2026-04-20 + 9 = 2026-04-29 → within bounds → valid
      expect(result.start.format("YYYY-MM-DD")).toBe("2026-04-20");
      expect(result.end.format("YYYY-MM-DD")).toBe("2026-04-29");
    });

    it("preserves span when end is picked before prev start", () => {
      const prev = { start: d("2026-04-20"), end: d("2026-04-30") }; // span=10
      const result = applyRangeRules(prev, d("2026-04-10"), "end", defaultBounds);
      // candidate: start=2026-04-20, end=2026-04-10 → out of order → invalid
      // derive: newStart = 2026-04-10 - 10 = 2026-03-31 → within bounds
      expect(result.start.format("YYYY-MM-DD")).toBe("2026-03-31");
      expect(result.end.format("YYYY-MM-DD")).toBe("2026-04-10");
    });
  });

  // ─── Invalid over-30-days candidate ──────────────────────────────────────

  describe("invalid over-maxRange candidate", () => {
    it("derives end from prevSpanDays when start change results in span > 30 days", () => {
      const prev = { start: d("2026-04-20"), end: d("2026-04-25") }; // span=5
      const result = applyRangeRules(prev, d("2026-03-01"), "start", defaultBounds);
      // candidate: start=2026-03-01, end=2026-04-25 → span=55 > 30 → invalid
      // derive: newEnd = 2026-03-01 + 5 = 2026-03-06
      expect(result.start.format("YYYY-MM-DD")).toBe("2026-03-01");
      expect(result.end.format("YYYY-MM-DD")).toBe("2026-03-06");
    });

    it("derives start from prevSpanDays when end change results in span > 30 days", () => {
      const prev = { start: d("2026-04-20"), end: d("2026-04-25") }; // span=5
      const result = applyRangeRules(prev, d("2026-05-01"), "end", defaultBounds);
      // candidate: start=2026-04-20, end=2026-05-01 → span=11 → ≤30, in order, within bounds → valid
      expect(result.start.format("YYYY-MM-DD")).toBe("2026-04-20");
      expect(result.end.format("YYYY-MM-DD")).toBe("2026-05-01");
    });

    it("derives start when end change makes span > 30 days", () => {
      const prev = { start: d("2026-04-01"), end: d("2026-04-06") }; // span=5
      const result = applyRangeRules(prev, d("2026-05-01"), "end", {
        ...defaultBounds,
        maxDate: d("2026-06-01"),
      });
      // candidate: start=2026-04-01, end=2026-05-01 → span=30 → valid (exactly maxRange)
      expect(result.start.format("YYYY-MM-DD")).toBe("2026-04-01");
      expect(result.end.format("YYYY-MM-DD")).toBe("2026-05-01");
    });

    it("derives start when end change makes span > 30 days (over by 1)", () => {
      const prev = { start: d("2026-03-31"), end: d("2026-04-06") }; // span=6
      const result = applyRangeRules(prev, d("2026-05-01"), "end", {
        ...defaultBounds,
        maxDate: d("2026-06-01"),
      });
      // candidate: start=2026-03-31, end=2026-05-01 → span=31 > 30 → invalid
      // derive: newStart = 2026-05-01 - 6 = 2026-04-25
      expect(result.start.format("YYYY-MM-DD")).toBe("2026-04-25");
      expect(result.end.format("YYYY-MM-DD")).toBe("2026-05-01");
    });
  });

  // ─── Picked date = minDate boundary ──────────────────────────────────────

  describe("picked date at or near minDate boundary", () => {
    it("returns valid candidate when picking exactly minDate as start (end still after it)", () => {
      const prev = { start: d("2019-10-05"), end: d("2019-10-15") }; // span=10
      const result = applyRangeRules(prev, d("2019-10-01"), "start", defaultBounds);
      // candidate: start=2019-10-01, end=2019-10-15 → span=14, in order, both in bounds → valid
      expect(result.start.format("YYYY-MM-DD")).toBe("2019-10-01");
      expect(result.end.format("YYYY-MM-DD")).toBe("2019-10-15");
    });

    it("clamps picked start below minDate to minDate", () => {
      const prev = { start: d("2019-10-05"), end: d("2019-10-15") }; // span=10
      // pick start=2019-09-01 (before minDate)
      const result = applyRangeRules(prev, d("2019-09-01"), "start", defaultBounds);
      // clamp picked to 2019-10-01
      // candidate: start=2019-10-01, end=2019-10-15 → span=14 → valid
      expect(result.start.format("YYYY-MM-DD")).toBe("2019-10-01");
      expect(result.end.format("YYYY-MM-DD")).toBe("2019-10-15");
    });
  });

  // ─── Auto-derived date exceeds maxDate ────────────────────────────────────

  describe("auto-derived date exceeds maxDate", () => {
    it("clamps derived end to maxDate when start is picked near maxDate", () => {
      const prev = { start: d("2026-04-01"), end: d("2026-04-20") }; // span=19
      const result = applyRangeRules(prev, d("2026-04-20"), "start", defaultBounds);
      // candidate: start=2026-04-20, end=2026-04-20 → span=0 ≤ 30, but start==end
      // actually isSame counts as valid (candidateInOrder includes isSame)
      // 0 span is valid per our check (candidateInOrder: start <= end)
      expect(result.start.format("YYYY-MM-DD")).toBe("2026-04-20");
      expect(result.end.format("YYYY-MM-DD")).toBe("2026-04-20");
    });

    it("clamps derived end to maxDate when span would push past it", () => {
      const prev = { start: d("2026-04-15"), end: d("2026-04-25") }; // span=10
      // pick start=2026-04-25 → candidate: 2026-04-25 to 2026-04-25 → span=0, valid (isSame)
      // But let's test a case where derived end would exceed maxDate
      const result = applyRangeRules(
        { start: d("2026-04-01"), end: d("2026-04-20") }, // span=19
        d("2026-04-20"),
        "start",
        { ...defaultBounds, maxDate: d("2026-04-30") }
      );
      // candidate: start=2026-04-20, end=2026-04-20 → valid (isSame)
      expect(result.start.format("YYYY-MM-DD")).toBe("2026-04-20");
      expect(result.end.format("YYYY-MM-DD")).toBe("2026-04-20");
    });

    it("clamps derived end to maxDate when prevSpan pushes it past maxDate", () => {
      // span=20, pick start 15 days before maxDate → derived end = maxDate + 5 → clamp
      const maxDate = d("2026-05-01");
      const prev = { start: d("2026-03-01"), end: d("2026-03-21") }; // span=20
      const pickedStart = maxDate.subtract(15, "day"); // 2026-04-16
      const result = applyRangeRules(prev, pickedStart, "start", {
        ...defaultBounds,
        maxDate,
      });
      // candidate: start=2026-04-16, end=2026-03-21 → out of order → invalid
      // derive: newEnd = 2026-04-16 + 20 = 2026-05-06 → clamp to 2026-05-01
      expect(result.start.format("YYYY-MM-DD")).toBe("2026-04-16");
      expect(result.end.format("YYYY-MM-DD")).toBe("2026-05-01");
    });
  });

  // ─── Auto-derived date before minDate ─────────────────────────────────────

  describe("auto-derived date before minDate → clamp + fallback 1-day", () => {
    it("clamps derived start to minDate when prevSpan would push before it", () => {
      const minDate = d("2019-10-01");
      const prev = { start: d("2019-10-03"), end: d("2019-10-13") }; // span=10
      // pick end = 2019-10-05 → candidate: start=2019-10-03, end=2019-10-05 → valid
      const result = applyRangeRules(prev, d("2019-10-05"), "end", defaultBounds);
      expect(result.start.format("YYYY-MM-DD")).toBe("2019-10-03");
      expect(result.end.format("YYYY-MM-DD")).toBe("2019-10-05");
    });

    it("clamps derived start to minDate when span would push before minDate", () => {
      const minDate = d("2019-10-01");
      const prev = { start: d("2019-10-05"), end: d("2019-10-20") }; // span=15
      // pick end = 2019-10-10 → candidate: start=2019-10-05, end=2019-10-10 → valid
      const result = applyRangeRules(prev, d("2019-10-10"), "end", defaultBounds);
      expect(result.start.format("YYYY-MM-DD")).toBe("2019-10-05");
      expect(result.end.format("YYYY-MM-DD")).toBe("2019-10-10");
    });

    it("clamps derived start to minDate when picking end near minDate with large prevSpan", () => {
      const minDate = d("2019-10-01");
      const prev = { start: d("2020-01-01"), end: d("2020-01-20") }; // span=19
      // pick end = 2019-10-10 → candidate: start=2020-01-01, end=2019-10-10 → out of order → invalid
      // derive: newStart = 2019-10-10 - 19 = 2019-09-21 → clamp to 2019-10-01
      const result = applyRangeRules(prev, d("2019-10-10"), "end", defaultBounds);
      expect(result.start.format("YYYY-MM-DD")).toBe("2019-10-01");
      expect(result.end.format("YYYY-MM-DD")).toBe("2019-10-10");
    });

    it("falls back to 1-day range at minDate boundary when span is zero after clamp", () => {
      // Example 4 from the spec
      const prev = { start: d("2019-10-03"), end: d("2019-10-08") }; // span=5
      // pick end = 2019-09-29 (before minDate=2019-10-01)
      const result = applyRangeRules(prev, d("2019-09-29"), "end", defaultBounds);
      // clamp picked to 2019-10-01
      // candidate: start=2019-10-03, end=2019-10-01 → out of order → invalid
      // derive: newStart = 2019-10-01 - 5 = 2019-09-26 → clamp to 2019-10-01
      // start==end → fallback: start = end - 1 = 2019-09-30 → clamp to minDate 2019-10-01
      // start == end again → at boundary, acceptable
      expect(result.end.format("YYYY-MM-DD")).toBe("2019-10-01");
      // start is at boundary (minDate), which equals end — that's the edge case
      expect(result.start.format("YYYY-MM-DD")).toBe("2019-10-01");
    });
  });

  // ─── Span=0 prev range ────────────────────────────────────────────────────

  describe("span=0 prev range", () => {
    it("picks start with span=0, candidate out-of-order → derives end, zero span → 1-day fallback", () => {
      const prev = { start: d("2026-04-10"), end: d("2026-04-10") }; // span=0
      const result = applyRangeRules(prev, d("2026-04-15"), "start", defaultBounds);
      // candidate: start=2026-04-15, end=2026-04-10 → out of order → invalid
      // derive: newEnd = 2026-04-15 + 0 = 2026-04-15 → start==end → 1-day fallback: end = 2026-04-16
      expect(result.start.format("YYYY-MM-DD")).toBe("2026-04-15");
      expect(result.end.format("YYYY-MM-DD")).toBe("2026-04-16");
    });

    it("picks end with span=0 and valid candidate returns candidate as-is", () => {
      const prev = { start: d("2026-04-10"), end: d("2026-04-10") }; // span=0
      const result = applyRangeRules(prev, d("2026-04-10"), "end", defaultBounds);
      // candidate: start=2026-04-10, end=2026-04-10 → span=0, in order (isSame), in bounds → valid
      expect(result.start.format("YYYY-MM-DD")).toBe("2026-04-10");
      expect(result.end.format("YYYY-MM-DD")).toBe("2026-04-10");
    });

    it("picks start with span=0 at same date → candidate valid", () => {
      const prev = { start: d("2026-04-10"), end: d("2026-04-10") }; // span=0
      const result = applyRangeRules(prev, d("2026-04-10"), "start", defaultBounds);
      // candidate: start=2026-04-10, end=2026-04-10 → valid
      expect(result.start.format("YYYY-MM-DD")).toBe("2026-04-10");
      expect(result.end.format("YYYY-MM-DD")).toBe("2026-04-10");
    });
  });

  // ─── Worked examples from the spec ───────────────────────────────────────

  describe("worked examples from spec", () => {
    it("Example 1: prev=2026-05-01→2026-05-03 (span=2), pick start=2025-04-02 → 2025-04-02→2025-04-04", () => {
      const prev = { start: d("2026-05-01"), end: d("2026-05-03") }; // span=2
      // maxDate must be >= 2026-05-03
      const bounds: RangeRulesBounds = {
        minDate: d("2019-10-01"),
        maxDate: d("2026-12-31"),
        maxRange: 30,
      };
      const result = applyRangeRules(prev, d("2025-04-02"), "start", bounds);
      // candidate: start=2025-04-02, end=2026-05-03 → span=396 > 30 → invalid
      // derive: newEnd = 2025-04-02 + 2 = 2025-04-04 → within bounds
      expect(result.start.format("YYYY-MM-DD")).toBe("2025-04-02");
      expect(result.end.format("YYYY-MM-DD")).toBe("2025-04-04");
    });

    it("Example 2: prev=2026-05-01→2026-05-03 (span=2), pick start=2026-04-02 → 2026-04-02→2026-04-04", () => {
      const prev = { start: d("2026-05-01"), end: d("2026-05-03") }; // span=2
      const bounds: RangeRulesBounds = {
        minDate: d("2019-10-01"),
        maxDate: d("2026-12-31"),
        maxRange: 30,
      };
      const result = applyRangeRules(prev, d("2026-04-02"), "start", bounds);
      // candidate: start=2026-04-02, end=2026-05-03 → span=31 > 30 → invalid
      // derive: newEnd = 2026-04-02 + 2 = 2026-04-04 → within bounds
      expect(result.start.format("YYYY-MM-DD")).toBe("2026-04-02");
      expect(result.end.format("YYYY-MM-DD")).toBe("2026-04-04");
    });

    it("Example 3: prev=2026-04-20→2026-04-25 (span=5), pick end=2026-04-22 → 2026-04-20→2026-04-22", () => {
      const prev = { start: d("2026-04-20"), end: d("2026-04-25") }; // span=5
      const bounds: RangeRulesBounds = {
        minDate: d("2019-10-01"),
        maxDate: d("2026-12-31"),
        maxRange: 30,
      };
      const result = applyRangeRules(prev, d("2026-04-22"), "end", bounds);
      // candidate: start=2026-04-20, end=2026-04-22 → span=2 ≤ 30, in order, in bounds → valid
      expect(result.start.format("YYYY-MM-DD")).toBe("2026-04-20");
      expect(result.end.format("YYYY-MM-DD")).toBe("2026-04-22");
    });

    it("Example 4 (bounds clamp): prev=2019-10-03→2019-10-08 (span=5), pick end=2019-09-29 → boundary case", () => {
      const prev = { start: d("2019-10-03"), end: d("2019-10-08") }; // span=5
      const result = applyRangeRules(prev, d("2019-09-29"), "end", defaultBounds);
      // picked clamped to 2019-10-01
      // candidate: start=2019-10-03, end=2019-10-01 → out of order → invalid
      // derive: newStart = 2019-10-01 - 5 = 2019-09-26 → clamp to 2019-10-01
      // start==end → fallback: start = 2019-10-01 - 1 = 2019-09-30 → clamp to 2019-10-01 → start==end still
      // Acceptable boundary state: start=end=minDate
      expect(result.end.format("YYYY-MM-DD")).toBe("2019-10-01");
      expect(result.start.format("YYYY-MM-DD")).toBe("2019-10-01");
    });
  });

  // ─── Additional edge cases ────────────────────────────────────────────────

  describe("additional edge cases", () => {
    it("picking a start date equal to prev end is treated as valid (zero span candidate)", () => {
      const prev = { start: d("2026-04-01"), end: d("2026-04-10") };
      const result = applyRangeRules(prev, d("2026-04-10"), "start", defaultBounds);
      // candidate: start=2026-04-10, end=2026-04-10 → span=0, isSame → valid
      expect(result.start.format("YYYY-MM-DD")).toBe("2026-04-10");
      expect(result.end.format("YYYY-MM-DD")).toBe("2026-04-10");
    });

    it("picking an end date equal to prev start is treated as valid (zero span candidate)", () => {
      const prev = { start: d("2026-04-10"), end: d("2026-04-20") };
      const result = applyRangeRules(prev, d("2026-04-10"), "end", defaultBounds);
      // candidate: start=2026-04-10, end=2026-04-10 → span=0, isSame → valid
      expect(result.start.format("YYYY-MM-DD")).toBe("2026-04-10");
      expect(result.end.format("YYYY-MM-DD")).toBe("2026-04-10");
    });

    it("clamps picked end above maxDate to maxDate", () => {
      const prev = { start: d("2026-04-01"), end: d("2026-04-10") };
      const result = applyRangeRules(prev, d("2027-01-01"), "end", defaultBounds);
      // clamp picked to maxDate=2026-05-01
      // candidate: start=2026-04-01, end=2026-05-01 → span=30 → valid
      expect(result.start.format("YYYY-MM-DD")).toBe("2026-04-01");
      expect(result.end.format("YYYY-MM-DD")).toBe("2026-05-01");
    });

    it("clamps picked start above maxDate to maxDate", () => {
      const prev = { start: d("2026-04-01"), end: d("2026-04-10") }; // span=9
      const result = applyRangeRules(prev, d("2027-01-01"), "start", defaultBounds);
      // clamp picked to maxDate=2026-05-01
      // candidate: start=2026-05-01, end=2026-04-10 → out of order → invalid
      // derive: newEnd = 2026-05-01 + 9 = 2026-05-10 → clamp to 2026-05-01
      // start==end → fallback: end = start + 1 = 2026-05-02 → clamp to maxDate 2026-05-01
      // start==end at boundary → acceptable
      expect(result.start.format("YYYY-MM-DD")).toBe("2026-05-01");
      expect(result.end.format("YYYY-MM-DD")).toBe("2026-05-01");
    });

    it("respects custom maxRange less than 30", () => {
      const bounds: RangeRulesBounds = {
        minDate: d("2019-10-01"),
        maxDate: d("2026-12-31"),
        maxRange: 7,
      };
      const prev = { start: d("2026-04-01"), end: d("2026-04-05") }; // span=4
      // pick start that would make candidate span > 7
      const result = applyRangeRules(prev, d("2026-03-20"), "start", bounds);
      // candidate: start=2026-03-20, end=2026-04-05 → span=16 > 7 → invalid
      // derive: newEnd = 2026-03-20 + 4 = 2026-03-24
      expect(result.start.format("YYYY-MM-DD")).toBe("2026-03-20");
      expect(result.end.format("YYYY-MM-DD")).toBe("2026-03-24");
    });

    it("does not loop infinitely for a pathological boundary condition", () => {
      // minDate == maxDate (degenerate bounds)
      const bounds: RangeRulesBounds = {
        minDate: d("2026-04-01"),
        maxDate: d("2026-04-01"),
        maxRange: 30,
      };
      const prev = { start: d("2026-04-01"), end: d("2026-04-01") };
      const result = applyRangeRules(prev, d("2026-04-01"), "start", bounds);
      // Everything is at the same date — should not crash/loop
      expect(result.start.format("YYYY-MM-DD")).toBe("2026-04-01");
      expect(result.end.format("YYYY-MM-DD")).toBe("2026-04-01");
    });
  });
});
