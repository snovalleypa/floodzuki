import dayjs, { Dayjs } from "dayjs";
import { applyFirstTap, applySecondTap } from "../applyRangeRulesRangeV1";

const d = (s: string): Dayjs => dayjs(s);

// Fixed context used across all tests (matches spec examples)
const prevStart = d("2026-04-20");
const prevEnd = d("2026-04-25");
const prevSpanDays = 5; // min(5, 30)
const minDate = d("2019-10-01");
const today = d("2026-05-03"); // resolvedMaxDate for most tests
const maxRange = 30;

const baseInput = { prevStart, prevEnd, prevSpanDays, maxRange, minDate, maxDate: today };

describe("applyFirstTap", () => {
  describe("Case 2a — tap within existing range (inclusive)", () => {
    it("returns awaitingEnd with maxDate = tapped + maxRange (unclamped)", () => {
      const result = applyFirstTap({ ...baseInput, tapped: d("2026-04-22") });
      expect(result.phase).toBe("awaitingEnd");
      if (result.phase !== "awaitingEnd") {
        return;
      }
      expect(result.tentativeStart.format("YYYY-MM-DD")).toBe("2026-04-22");
      expect(result.proposedStart.format("YYYY-MM-DD")).toBe("2026-04-22");
      expect(result.proposedEnd).toBeNull();
      // maxDate = tapped + 30 = 2026-05-22 (component clamps to today before passing to picker)
      expect(result.maxDate.format("YYYY-MM-DD")).toBe("2026-05-22");
    });

    it("returns awaitingEnd when tap is exactly on prevStart", () => {
      const result = applyFirstTap({ ...baseInput, tapped: d("2026-04-20") });
      expect(result.phase).toBe("awaitingEnd");
    });

    it("returns awaitingEnd when tap is exactly on prevEnd", () => {
      const result = applyFirstTap({ ...baseInput, tapped: d("2026-04-25") });
      expect(result.phase).toBe("awaitingEnd");
    });
  });

  describe("Case 2b — tap before prevStart by a small amount (within maxRange + prevSpanDays)", () => {
    it("keeps prevEnd when prevEnd is within maxRange of the tap", () => {
      // tap 10 days before prevStart; prevEnd 15 days from tap → kept
      const result = applyFirstTap({ ...baseInput, tapped: d("2026-04-10") });
      expect(result.phase).toBe("idle");
      if (result.phase !== "idle") {
        return;
      }
      expect(result.proposedStart.format("YYYY-MM-DD")).toBe("2026-04-10");
      expect(result.proposedEnd.format("YYYY-MM-DD")).toBe("2026-04-25");
    });

    it("keeps prevEnd when prevEnd is 29 days from tap", () => {
      // tap 24 days before prevStart; prevEnd 29 days from tap → kept
      const result = applyFirstTap({ ...baseInput, tapped: d("2026-03-27") });
      expect(result.phase).toBe("idle");
      if (result.phase !== "idle") {
        return;
      }
      expect(result.proposedStart.format("YYYY-MM-DD")).toBe("2026-03-27");
      expect(result.proposedEnd.format("YYYY-MM-DD")).toBe("2026-04-25");
    });

    it("caps proposedEnd at tapped + maxRange when prevEnd is 35 days away", () => {
      // tap 30 days before prevStart; prevEnd 35 days from tap → cap at tapped+30
      const result = applyFirstTap({ ...baseInput, tapped: d("2026-03-21") });
      expect(result.phase).toBe("idle");
      if (result.phase !== "idle") {
        return;
      }
      expect(result.proposedStart.format("YYYY-MM-DD")).toBe("2026-03-21");
      expect(result.proposedEnd.format("YYYY-MM-DD")).toBe("2026-04-20");
    });
  });

  describe("Case 2c — tap far before prevStart (beyond maxRange + prevSpanDays)", () => {
    it("preserves span from new start", () => {
      // tap 78 days before prevStart → span preserved: [2026-02-01, 2026-02-06]
      const result = applyFirstTap({ ...baseInput, tapped: d("2026-02-01") });
      expect(result.phase).toBe("idle");
      if (result.phase !== "idle") {
        return;
      }
      expect(result.proposedStart.format("YYYY-MM-DD")).toBe("2026-02-01");
      expect(result.proposedEnd.format("YYYY-MM-DD")).toBe("2026-02-06");
    });

    it("clamps proposedStart to minDate when tap is before minDate", () => {
      // tap before 2019-10-01 → proposedStart clamped to minDate; span from clamped start
      const result = applyFirstTap({ ...baseInput, tapped: d("2019-09-25") });
      expect(result.phase).toBe("idle");
      if (result.phase !== "idle") {
        return;
      }
      expect(result.proposedStart.format("YYYY-MM-DD")).toBe("2019-10-01");
      expect(result.proposedEnd.format("YYYY-MM-DD")).toBe("2019-10-06");
    });
  });

  describe("Case 2d — tap after prevEnd by a small amount (within maxRange + prevSpanDays)", () => {
    it("keeps prevStart when prevStart is within maxRange of the tap", () => {
      // tap 4 days after prevEnd; prevStart 9 days from tap → kept
      const result = applyFirstTap({ ...baseInput, tapped: d("2026-04-29") });
      expect(result.phase).toBe("idle");
      if (result.phase !== "idle") {
        return;
      }
      expect(result.proposedStart.format("YYYY-MM-DD")).toBe("2026-04-20");
      expect(result.proposedEnd.format("YYYY-MM-DD")).toBe("2026-04-29");
    });

    it("pulls proposedStart forward to tapped - maxRange when prevStart is too far back", () => {
      // tap 30 days after prevEnd; prevStart 35 days from tap → pull: tapped - 30 = 2026-04-25
      const result = applyFirstTap({ ...baseInput, tapped: d("2026-05-25") });
      expect(result.phase).toBe("idle");
      if (result.phase !== "idle") {
        return;
      }
      expect(result.proposedStart.format("YYYY-MM-DD")).toBe("2026-04-25");
      expect(result.proposedEnd.format("YYYY-MM-DD")).toBe("2026-05-25");
    });
  });

  describe("Case 2e — tap far after prevEnd (beyond maxRange + prevSpanDays)", () => {
    it("preserves span from new start (uses far-future maxDate to avoid end-clamping)", () => {
      // tap 51 days after prevEnd → span preserved; use far-future maxDate so end is not clamped
      // (in the real UI this tap is unreachable since picker maxDate = today; guard is in the component)
      const result = applyFirstTap({
        ...baseInput,
        maxDate: d("2099-12-31"),
        tapped: d("2026-06-15"),
      });
      expect(result.phase).toBe("idle");
      if (result.phase !== "idle") {
        return;
      }
      expect(result.proposedStart.format("YYYY-MM-DD")).toBe("2026-06-15");
      expect(result.proposedEnd.format("YYYY-MM-DD")).toBe("2026-06-20");
    });
  });
});

describe("applySecondTap", () => {
  it("pairs tentativeStart and endDate into an idle result", () => {
    const result = applySecondTap(d("2026-04-22"), d("2026-04-30"));
    expect(result.phase).toBe("idle");
    expect(result.proposedStart.format("YYYY-MM-DD")).toBe("2026-04-22");
    expect(result.proposedEnd.format("YYYY-MM-DD")).toBe("2026-04-30");
  });
});
