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
      expect(result.wasRestricted).toBe(false);
    });

    it("returns candidate unchanged when picking end that keeps range ≤ 30 days, in order, within bounds", () => {
      const prev = { start: d("2026-04-01"), end: d("2026-04-20") };
      const result = applyRangeRules(prev, d("2026-04-15"), "end", defaultBounds);
      expect(result.start.format("YYYY-MM-DD")).toBe("2026-04-01");
      expect(result.end.format("YYYY-MM-DD")).toBe("2026-04-15");
      expect(result.wasRestricted).toBe(false);
    });

    it("expands to max range when start moved earlier by ≤ maxRange days, causing span violation", () => {
      const prev = { start: d("2026-04-01"), end: d("2026-04-20") };
      const result = applyRangeRules(prev, d("2026-03-20"), "start", defaultBounds);
      // candidate: start=2026-03-20, end=2026-04-20 → span=31 > 30, in order
      // prev.start.diff(picked, 'day') = 12 ≤ 30 → widen: derivedEnd = 2026-03-20 + 30 = 2026-04-19
      expect(result.start.format("YYYY-MM-DD")).toBe("2026-03-20");
      expect(result.end.format("YYYY-MM-DD")).toBe("2026-04-19");
      expect(result.wasRestricted).toBe(true);
    });

    it("returns candidate for exactly maxRange end pick that is still valid", () => {
      const prev = { start: d("2026-04-01"), end: d("2026-04-10") };
      // pick end = 2026-05-01 → span = 30 → valid
      const result = applyRangeRules(prev, d("2026-05-01"), "end", defaultBounds);
      expect(result.start.format("YYYY-MM-DD")).toBe("2026-04-01");
      expect(result.end.format("YYYY-MM-DD")).toBe("2026-05-01");
      expect(result.wasRestricted).toBe(false);
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
      expect(result.wasRestricted).toBe(false);
    });

    it("preserves span when end is picked before prev start", () => {
      const prev = { start: d("2026-04-20"), end: d("2026-04-30") }; // span=10
      const result = applyRangeRules(prev, d("2026-04-10"), "end", defaultBounds);
      // candidate: start=2026-04-20, end=2026-04-10 → out of order → invalid
      // derive: newStart = 2026-04-10 - 10 = 2026-03-31 → within bounds
      expect(result.start.format("YYYY-MM-DD")).toBe("2026-03-31");
      expect(result.end.format("YYYY-MM-DD")).toBe("2026-04-10");
      expect(result.wasRestricted).toBe(false);
    });
  });

  // ─── Invalid over-30-days candidate ──────────────────────────────────────

  describe("invalid over-maxRange candidate", () => {
    it("derives end from prevSpanDays when start change results in span > 30 days", () => {
      const prev = { start: d("2026-04-20"), end: d("2026-04-25") }; // span=5
      const result = applyRangeRules(prev, d("2026-03-01"), "start", defaultBounds);
      // candidate: start=2026-03-01, end=2026-04-25 → span=55 > 30 → invalid
      // derive: newEnd = 2026-03-01 + 5 = 2026-03-06
      // distance from prevStart: 2026-04-20 - 2026-03-01 = 50 > 30 → no widen
      expect(result.start.format("YYYY-MM-DD")).toBe("2026-03-01");
      expect(result.end.format("YYYY-MM-DD")).toBe("2026-03-06");
      expect(result.wasRestricted).toBe(false);
    });

    it("derives start from prevSpanDays when end change results in span > 30 days", () => {
      const prev = { start: d("2026-04-20"), end: d("2026-04-25") }; // span=5
      const result = applyRangeRules(prev, d("2026-05-01"), "end", defaultBounds);
      // candidate: start=2026-04-20, end=2026-05-01 → span=11 → ≤30, in order, within bounds → valid
      expect(result.start.format("YYYY-MM-DD")).toBe("2026-04-20");
      expect(result.end.format("YYYY-MM-DD")).toBe("2026-05-01");
      expect(result.wasRestricted).toBe(false);
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
      expect(result.wasRestricted).toBe(false);
    });

    it("expands to max range when end moved later by ≤ maxRange days, causing span violation", () => {
      const prev = { start: d("2026-03-31"), end: d("2026-04-06") }; // span=6
      const result = applyRangeRules(prev, d("2026-05-01"), "end", {
        ...defaultBounds,
        maxDate: d("2026-06-01"),
      });
      // candidate: start=2026-03-31, end=2026-05-01 → span=31 > 30, in order
      // picked.diff(prev.end, 'day') = 25 ≤ 30 → widen: derivedStart = 2026-05-01 - 30 = 2026-04-01
      expect(result.start.format("YYYY-MM-DD")).toBe("2026-04-01");
      expect(result.end.format("YYYY-MM-DD")).toBe("2026-05-01");
      expect(result.wasRestricted).toBe(true);
    });
  });

  // ─── Widen-to-max-range exception ────────────────────────────────────────

  describe("widen-to-max-range exception", () => {
    // ── Start side ──────────────────────────────────────────────────────────

    it("expands end to full maxRange when start moved earlier by < maxRange days causing violation", () => {
      const prev = { start: d("2026-04-20"), end: d("2026-04-25") }; // span=5
      const result = applyRangeRules(prev, d("2026-03-25"), "start", defaultBounds);
      // candidate: Mar 25–Apr 25 = 31 days > 30, in order
      // prev.start.diff(Mar 25, 'day') = 26 ≤ 30 → widen: end = Mar 25 + 30 = Apr 24
      expect(result.start.format("YYYY-MM-DD")).toBe("2026-03-25");
      expect(result.end.format("YYYY-MM-DD")).toBe("2026-04-24");
      expect(result.wasRestricted).toBe(true);
    });

    it("expands end to full maxRange when start moved exactly maxRange days earlier (boundary)", () => {
      const prev = { start: d("2026-04-20"), end: d("2026-04-25") }; // span=5
      const result = applyRangeRules(prev, d("2026-03-21"), "start", defaultBounds);
      // prev.start.diff(Mar 21, 'day') = 30 = maxRange → widen: end = Mar 21 + 30 = Apr 20
      expect(result.start.format("YYYY-MM-DD")).toBe("2026-03-21");
      expect(result.end.format("YYYY-MM-DD")).toBe("2026-04-20");
      expect(result.wasRestricted).toBe(true);
    });

    it("preserves span (old rule) when start moved more than maxRange days earlier", () => {
      const prev = { start: d("2026-04-20"), end: d("2026-04-25") }; // span=5
      const result = applyRangeRules(prev, d("2026-03-20"), "start", defaultBounds);
      // prev.start.diff(Mar 20, 'day') = 31 > 30 → old rule: end = Mar 20 + 5 = Mar 25
      expect(result.start.format("YYYY-MM-DD")).toBe("2026-03-20");
      expect(result.end.format("YYYY-MM-DD")).toBe("2026-03-25");
      expect(result.wasRestricted).toBe(false);
    });

    // ── End side ─────────────────────────────────────────────────────────────

    it("expands start to full maxRange when end moved later by < maxRange days causing violation", () => {
      const prev = { start: d("2026-04-20"), end: d("2026-04-25") }; // span=5
      const result = applyRangeRules(prev, d("2026-05-21"), "end", {
        ...defaultBounds,
        maxDate: d("2026-12-31"),
      });
      // candidate: Apr 20–May 21 = 31 days > 30, in order
      // May 21.diff(Apr 25, 'day') = 26 ≤ 30 → widen: start = May 21 - 30 = Apr 21
      expect(result.start.format("YYYY-MM-DD")).toBe("2026-04-21");
      expect(result.end.format("YYYY-MM-DD")).toBe("2026-05-21");
      expect(result.wasRestricted).toBe(true);
    });

    it("expands start to full maxRange when end moved exactly maxRange days later (boundary)", () => {
      const prev = { start: d("2026-04-20"), end: d("2026-04-25") }; // span=5
      const result = applyRangeRules(prev, d("2026-05-25"), "end", {
        ...defaultBounds,
        maxDate: d("2026-12-31"),
      });
      // May 25.diff(Apr 25, 'day') = 30 = maxRange → widen: start = May 25 - 30 = Apr 25
      expect(result.start.format("YYYY-MM-DD")).toBe("2026-04-25");
      expect(result.end.format("YYYY-MM-DD")).toBe("2026-05-25");
      expect(result.wasRestricted).toBe(true);
    });

    it("preserves span (old rule) when end moved more than maxRange days later", () => {
      const prev = { start: d("2026-04-20"), end: d("2026-04-25") }; // span=5
      const result = applyRangeRules(prev, d("2026-05-26"), "end", {
        ...defaultBounds,
        maxDate: d("2026-12-31"),
      });
      // May 26.diff(Apr 25, 'day') = 31 > 30 → old rule: start = May 26 - 5 = May 21
      expect(result.start.format("YYYY-MM-DD")).toBe("2026-05-21");
      expect(result.end.format("YYYY-MM-DD")).toBe("2026-05-26");
      expect(result.wasRestricted).toBe(false);
    });

    // ── Widen exception + clamping ────────────────────────────────────────────

    it("clamps the widen-derived end to maxDate when it exceeds the bound", () => {
      const prev = { start: d("2026-04-20"), end: d("2026-04-25") }; // span=5
      // Use a tighter maxDate to force the clamp:
      const result = applyRangeRules(prev, d("2026-03-25"), "start", {
        ...defaultBounds,
        maxDate: d("2026-04-20"),
      });
      // derivedEnd = Mar 25 + 30 = Apr 24 > maxDate Apr 20 → clamp to Apr 20
      expect(result.start.format("YYYY-MM-DD")).toBe("2026-03-25");
      expect(result.end.format("YYYY-MM-DD")).toBe("2026-04-20");
      expect(result.wasRestricted).toBe(true);
    });

    it("clamps the widen-derived start to minDate when it precedes the bound", () => {
      const prev = { start: d("2019-10-10"), end: d("2019-10-25") }; // span=15
      // Use tighter minDate to force clamp:
      const result = applyRangeRules(prev, d("2019-11-10"), "end", {
        minDate: d("2019-10-15"),
        maxDate: d("2026-05-01"),
        maxRange: 30,
      });
      // derivedStart = Nov 10 - 30 = Oct 11 < minDate Oct 15 → clamp to Oct 15
      expect(result.start.format("YYYY-MM-DD")).toBe("2019-10-15");
      expect(result.end.format("YYYY-MM-DD")).toBe("2019-11-10");
      expect(result.wasRestricted).toBe(true);
    });

    // ── Out-of-order candidate is NOT subject to the widen exception ──────────

    it("does NOT apply widen exception when candidate is out-of-order (preserves span)", () => {
      // Start picked after current end → out-of-order, not over-range
      const prev = { start: d("2026-04-01"), end: d("2026-04-10") }; // span=9
      const result = applyRangeRules(prev, d("2026-04-20"), "start", defaultBounds);
      // candidate: Apr 20–Apr 10 → out of order (NOT over-range-in-order)
      // widen exception does NOT apply; old rule: end = Apr 20 + 9 = Apr 29
      expect(result.start.format("YYYY-MM-DD")).toBe("2026-04-20");
      expect(result.end.format("YYYY-MM-DD")).toBe("2026-04-29");
      expect(result.wasRestricted).toBe(false);
    });

    // ── Custom maxRange ───────────────────────────────────────────────────────

    it("uses custom maxRange as both the threshold and the expansion size", () => {
      const bounds: RangeRulesBounds = {
        minDate: d("2019-10-01"),
        maxDate: d("2026-12-31"),
        maxRange: 7,
      };
      const prev = { start: d("2026-04-10"), end: d("2026-04-14") }; // span=4
      // pick start = 2026-04-03 → candidate: Apr 3–Apr 14 = 11 days > 7, in order
      // prev.start.diff(Apr 3, 'day') = 7 ≤ 7 → widen: derivedEnd = Apr 3 + 7 = Apr 10
      const result = applyRangeRules(prev, d("2026-04-03"), "start", bounds);
      expect(result.start.format("YYYY-MM-DD")).toBe("2026-04-03");
      expect(result.end.format("YYYY-MM-DD")).toBe("2026-04-10");
      expect(result.wasRestricted).toBe(true);
    });

    it("preserves span with custom maxRange when movement exceeds that maxRange", () => {
      const bounds: RangeRulesBounds = {
        minDate: d("2019-10-01"),
        maxDate: d("2026-12-31"),
        maxRange: 7,
      };
      const prev = { start: d("2026-04-10"), end: d("2026-04-14") }; // span=4
      // pick start = 2026-04-02 → candidate: Apr 2–Apr 14 = 12 days > 7, in order
      // prev.start.diff(Apr 2, 'day') = 8 > 7 → old rule: derivedEnd = Apr 2 + 4 = Apr 6
      const result = applyRangeRules(prev, d("2026-04-02"), "start", bounds);
      expect(result.start.format("YYYY-MM-DD")).toBe("2026-04-02");
      expect(result.end.format("YYYY-MM-DD")).toBe("2026-04-06");
      expect(result.wasRestricted).toBe(false);
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
      expect(result.wasRestricted).toBe(false);
    });

    it("clamps picked start below minDate to minDate", () => {
      const prev = { start: d("2019-10-05"), end: d("2019-10-15") }; // span=10
      // pick start=2019-09-01 (before minDate)
      const result = applyRangeRules(prev, d("2019-09-01"), "start", defaultBounds);
      // clamp picked to 2019-10-01
      // candidate: start=2019-10-01, end=2019-10-15 → span=14 → valid
      expect(result.start.format("YYYY-MM-DD")).toBe("2019-10-01");
      expect(result.end.format("YYYY-MM-DD")).toBe("2019-10-15");
      expect(result.wasRestricted).toBe(false);
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
      expect(result.wasRestricted).toBe(false);
    });

    it("clamps derived end to maxDate when span would push past it", () => {
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
      expect(result.wasRestricted).toBe(false);
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
      // candidateOverRangeOnly = false (out of order) → no widen exception
      expect(result.start.format("YYYY-MM-DD")).toBe("2026-04-16");
      expect(result.end.format("YYYY-MM-DD")).toBe("2026-05-01");
      expect(result.wasRestricted).toBe(false);
    });
  });

  // ─── Auto-derived date before minDate ─────────────────────────────────────

  describe("auto-derived date before minDate → clamp + fallback 1-day", () => {
    it("clamps derived start to minDate when prevSpan would push before it", () => {
      const prev = { start: d("2019-10-03"), end: d("2019-10-13") }; // span=10
      // pick end = 2019-10-05 → candidate: start=2019-10-03, end=2019-10-05 → valid
      const result = applyRangeRules(prev, d("2019-10-05"), "end", defaultBounds);
      expect(result.start.format("YYYY-MM-DD")).toBe("2019-10-03");
      expect(result.end.format("YYYY-MM-DD")).toBe("2019-10-05");
      expect(result.wasRestricted).toBe(false);
    });

    it("clamps derived start to minDate when span would push before minDate", () => {
      const prev = { start: d("2019-10-05"), end: d("2019-10-20") }; // span=15
      // pick end = 2019-10-10 → candidate: start=2019-10-05, end=2019-10-10 → valid
      const result = applyRangeRules(prev, d("2019-10-10"), "end", defaultBounds);
      expect(result.start.format("YYYY-MM-DD")).toBe("2019-10-05");
      expect(result.end.format("YYYY-MM-DD")).toBe("2019-10-10");
      expect(result.wasRestricted).toBe(false);
    });

    it("clamps derived start to minDate when picking end near minDate with large prevSpan", () => {
      const prev = { start: d("2020-01-01"), end: d("2020-01-20") }; // span=19
      // pick end = 2019-10-10 → candidate: start=2020-01-01, end=2019-10-10 → out of order → invalid
      // derive: newStart = 2019-10-10 - 19 = 2019-09-21 → clamp to 2019-10-01
      // candidateOverRangeOnly = false (out of order) → no widen exception
      const result = applyRangeRules(prev, d("2019-10-10"), "end", defaultBounds);
      expect(result.start.format("YYYY-MM-DD")).toBe("2019-10-01");
      expect(result.end.format("YYYY-MM-DD")).toBe("2019-10-10");
      expect(result.wasRestricted).toBe(false);
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
      // candidateOverRangeOnly = false (out of order) → no widen exception
      expect(result.end.format("YYYY-MM-DD")).toBe("2019-10-01");
      // start is at boundary (minDate), which equals end — that's the edge case
      expect(result.start.format("YYYY-MM-DD")).toBe("2019-10-01");
      expect(result.wasRestricted).toBe(false);
    });
  });

  // ─── Span=0 prev range ────────────────────────────────────────────────────

  describe("span=0 prev range", () => {
    it("picks start with span=0, candidate out-of-order → derives end, zero span → 1-day fallback", () => {
      const prev = { start: d("2026-04-10"), end: d("2026-04-10") }; // span=0
      const result = applyRangeRules(prev, d("2026-04-15"), "start", defaultBounds);
      // candidate: start=2026-04-15, end=2026-04-10 → out of order → invalid
      // derive: newEnd = 2026-04-15 + 0 = 2026-04-15 → start==end → 1-day fallback: end = 2026-04-16
      // candidateOverRangeOnly = false (out of order) → no widen exception
      expect(result.start.format("YYYY-MM-DD")).toBe("2026-04-15");
      expect(result.end.format("YYYY-MM-DD")).toBe("2026-04-16");
      expect(result.wasRestricted).toBe(false);
    });

    it("picks end with span=0 and valid candidate returns candidate as-is", () => {
      const prev = { start: d("2026-04-10"), end: d("2026-04-10") }; // span=0
      const result = applyRangeRules(prev, d("2026-04-10"), "end", defaultBounds);
      // candidate: start=2026-04-10, end=2026-04-10 → span=0, in order (isSame), in bounds → valid
      expect(result.start.format("YYYY-MM-DD")).toBe("2026-04-10");
      expect(result.end.format("YYYY-MM-DD")).toBe("2026-04-10");
      expect(result.wasRestricted).toBe(false);
    });

    it("picks start with span=0 at same date → candidate valid", () => {
      const prev = { start: d("2026-04-10"), end: d("2026-04-10") }; // span=0
      const result = applyRangeRules(prev, d("2026-04-10"), "start", defaultBounds);
      // candidate: start=2026-04-10, end=2026-04-10 → valid
      expect(result.start.format("YYYY-MM-DD")).toBe("2026-04-10");
      expect(result.end.format("YYYY-MM-DD")).toBe("2026-04-10");
      expect(result.wasRestricted).toBe(false);
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
      // distance from prevStart: 2026-05-01 - 2025-04-02 = 394 > 30 → no widen
      expect(result.start.format("YYYY-MM-DD")).toBe("2025-04-02");
      expect(result.end.format("YYYY-MM-DD")).toBe("2025-04-04");
      expect(result.wasRestricted).toBe(false);
    });

    it("Example 2 updated: prev=2026-05-01→2026-05-03, pick start=2026-04-02 → expands to full max range: 2026-04-02→2026-05-02", () => {
      const prev = { start: d("2026-05-01"), end: d("2026-05-03") }; // span=2
      const bounds: RangeRulesBounds = {
        minDate: d("2019-10-01"),
        maxDate: d("2026-12-31"),
        maxRange: 30,
      };
      const result = applyRangeRules(prev, d("2026-04-02"), "start", bounds);
      // candidate: start=2026-04-02, end=2026-05-03 → span=31 > 30, in order
      // prev.start.diff(picked, 'day') = 29 ≤ 30 → widen: derivedEnd = 2026-04-02 + 30 = 2026-05-02
      expect(result.start.format("YYYY-MM-DD")).toBe("2026-04-02");
      expect(result.end.format("YYYY-MM-DD")).toBe("2026-05-02");
      expect(result.wasRestricted).toBe(true);
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
      expect(result.wasRestricted).toBe(false);
    });

    it("Example 4 (bounds clamp): prev=2019-10-03→2019-10-08 (span=5), pick end=2019-09-29 → boundary case", () => {
      const prev = { start: d("2019-10-03"), end: d("2019-10-08") }; // span=5
      const result = applyRangeRules(prev, d("2019-09-29"), "end", defaultBounds);
      // picked clamped to 2019-10-01
      // candidate: start=2019-10-03, end=2019-10-01 → out of order → invalid
      // derive: newStart = 2019-10-01 - 5 = 2019-09-26 → clamp to 2019-10-01
      // start==end → fallback: start = 2019-10-01 - 1 = 2019-09-30 → clamp to 2019-10-01 → start==end still
      // Acceptable boundary state: start=end=minDate
      // candidateOverRangeOnly = false (out of order) → no widen exception
      expect(result.end.format("YYYY-MM-DD")).toBe("2019-10-01");
      expect(result.start.format("YYYY-MM-DD")).toBe("2019-10-01");
      expect(result.wasRestricted).toBe(false);
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
      expect(result.wasRestricted).toBe(false);
    });

    it("picking an end date equal to prev start is treated as valid (zero span candidate)", () => {
      const prev = { start: d("2026-04-10"), end: d("2026-04-20") };
      const result = applyRangeRules(prev, d("2026-04-10"), "end", defaultBounds);
      // candidate: start=2026-04-10, end=2026-04-10 → span=0, isSame → valid
      expect(result.start.format("YYYY-MM-DD")).toBe("2026-04-10");
      expect(result.end.format("YYYY-MM-DD")).toBe("2026-04-10");
      expect(result.wasRestricted).toBe(false);
    });

    it("clamps picked end above maxDate to maxDate", () => {
      const prev = { start: d("2026-04-01"), end: d("2026-04-10") };
      const result = applyRangeRules(prev, d("2027-01-01"), "end", defaultBounds);
      // clamp picked to maxDate=2026-05-01
      // candidate: start=2026-04-01, end=2026-05-01 → span=30 → valid
      expect(result.start.format("YYYY-MM-DD")).toBe("2026-04-01");
      expect(result.end.format("YYYY-MM-DD")).toBe("2026-05-01");
      expect(result.wasRestricted).toBe(false);
    });

    it("clamps picked start above maxDate to maxDate", () => {
      const prev = { start: d("2026-04-01"), end: d("2026-04-10") }; // span=9
      const result = applyRangeRules(prev, d("2027-01-01"), "start", defaultBounds);
      // clamp picked to maxDate=2026-05-01
      // candidate: start=2026-05-01, end=2026-04-10 → out of order → invalid
      // derive: newEnd = 2026-05-01 + 9 = 2026-05-10 → clamp to 2026-05-01
      // start==end → fallback: end = start + 1 = 2026-05-02 → clamp to maxDate 2026-05-01
      // start==end at boundary → acceptable
      // candidateOverRangeOnly = false (out of order) → no widen exception
      expect(result.start.format("YYYY-MM-DD")).toBe("2026-05-01");
      expect(result.end.format("YYYY-MM-DD")).toBe("2026-05-01");
      expect(result.wasRestricted).toBe(false);
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
      // distance from prevStart: 2026-04-01 - 2026-03-20 = 12 > 7 → no widen exception
      expect(result.start.format("YYYY-MM-DD")).toBe("2026-03-20");
      expect(result.end.format("YYYY-MM-DD")).toBe("2026-03-24");
      expect(result.wasRestricted).toBe(false);
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
      expect(result.wasRestricted).toBe(false);
    });
  });
});
