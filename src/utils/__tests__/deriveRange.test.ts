import localDayJs from "@services/localDayJs";
import { deriveRange, CHART_DEFAULT_RANGE_DAYS } from "../deriveRange";

// Exercise the gauge-tz logic across a westward, eastward, and far-east tz.
// Each runs under TZ=UTC (set by `npm test`), so this also catches any code
// that silently uses system tz instead of the gauge tz parameter.
const TZ_CASES = [["America/Los_Angeles"], ["America/New_York"], ["Pacific/Auckland"]] as const;

describe.each(TZ_CASES)("deriveRange [%s]", (TZ) => {
  it("returns a default live-mode range when both URL params are missing", () => {
    const now = localDayJs.tz("2026-05-14T10:00:00", "YYYY-MM-DDTHH:mm:ss", TZ);
    const range = deriveRange(undefined, undefined, TZ, now);

    expect(range.isNow).toBe(true);
    expect(range.chartEndDate.valueOf()).toBe(now.valueOf());
    expect(range.chartStartDate.valueOf()).toBe(
      now.subtract(CHART_DEFAULT_RANGE_DAYS, "d").valueOf()
    );
  });

  it("returns a default live-mode range when only one of from/to is set", () => {
    const now = localDayJs.tz("2026-05-14T10:00:00", "YYYY-MM-DDTHH:mm:ss", TZ);
    const range = deriveRange("2020-05-01", undefined, TZ, now);

    expect(range.isNow).toBe(true);
    expect(range.chartEndDate.valueOf()).toBe(now.valueOf());
  });

  it("parses fully historic URL params as isNow=false with day-boundary bounds", () => {
    const now = localDayJs.tz("2026-05-14T10:00:00", "YYYY-MM-DDTHH:mm:ss", TZ);
    const range = deriveRange("2020-02-04", "2020-02-13", TZ, now);

    expect(range.isNow).toBe(false);
    expect(range.chartStartDate.tz(TZ).format("YYYY-MM-DD HH:mm:ss")).toBe("2020-02-04 00:00:00");
    expect(range.chartEndDate.tz(TZ).format("YYYY-MM-DD HH:mm:ss")).toBe("2020-02-13 23:59:59");
  });

  it("auto-promotes to live mode when end date equals today in gauge tz", () => {
    const now = localDayJs.tz("2026-05-14T10:00:00", "YYYY-MM-DDTHH:mm:ss", TZ);
    const range = deriveRange("2026-05-07", "2026-05-14", TZ, now);

    expect(range.isNow).toBe(true);
    expect(range.chartEndDate.valueOf()).toBe(now.valueOf());
    expect(range.chartStartDate.tz(TZ).format("YYYY-MM-DD HH:mm:ss")).toBe("2026-05-07 00:00:00");
  });

  it("auto-promotes to live mode when end date is in the future in gauge tz", () => {
    const now = localDayJs.tz("2026-05-14T10:00:00", "YYYY-MM-DDTHH:mm:ss", TZ);
    const range = deriveRange("2026-05-10", "2026-05-20", TZ, now);

    expect(range.isNow).toBe(true);
    expect(range.chartEndDate.valueOf()).toBe(now.valueOf());
  });

  it("uses gauge-tz day comparison for isNow promotion, not system tz", () => {
    // "now" is 2026-05-14 01:00 PDT (still 2026-05-14 in PDT)
    // URL "to" is "2026-05-14" — should auto-promote even if system tz disagrees
    const now = localDayJs.tz("2026-05-14T01:00:00", "YYYY-MM-DDTHH:mm:ss", TZ);
    const range = deriveRange("2026-05-13", "2026-05-14", TZ, now);

    expect(range.isNow).toBe(true);
  });

  it("falls back to default range when from is malformed", () => {
    const now = localDayJs.tz("2026-05-14T10:00:00", "YYYY-MM-DDTHH:mm:ss", TZ);
    const range = deriveRange("not-a-date", "2026-05-14", TZ, now);

    expect(range.isNow).toBe(true);
    expect(range.chartStartDate.valueOf()).toBe(
      now.subtract(CHART_DEFAULT_RANGE_DAYS, "d").valueOf()
    );
  });

  it("accepts legacy UTC ISO strings in URL params", () => {
    const now = localDayJs.tz("2026-05-14T10:00:00", "YYYY-MM-DDTHH:mm:ss", TZ);
    const range = deriveRange("2020-02-04T08:00:00Z", "2020-02-13T08:00:00Z", TZ, now);

    expect(range.isNow).toBe(false);
    // 2020-02-04T08:00:00Z = 2020-02-04 00:00 PST
    expect(range.chartStartDate.tz(TZ).format("YYYY-MM-DD")).toBe("2020-02-04");
  });

  describe("relative live URL format (to=now, from=-N)", () => {
    it("treats to=now as live mode with end at the injected now", () => {
      const now = localDayJs.tz("2026-05-14T10:00:00", "YYYY-MM-DDTHH:mm:ss", TZ);
      const range = deriveRange("2026-05-01", "now", TZ, now);

      expect(range.isNow).toBe(true);
      expect(range.chartEndDate.valueOf()).toBe(now.valueOf());
    });

    it("resolves from=-N as now minus N days", () => {
      const now = localDayJs.tz("2026-05-14T10:00:00", "YYYY-MM-DDTHH:mm:ss", TZ);
      const range = deriveRange("-7", "now", TZ, now);

      expect(range.isNow).toBe(true);
      expect(range.chartStartDate.valueOf()).toBe(now.subtract(7, "d").valueOf());
      expect(range.chartEndDate.valueOf()).toBe(now.valueOf());
    });

    it("produces an exact 24-hour window for from=-1&to=now", () => {
      const now = localDayJs.tz("2026-05-14T10:00:00", "YYYY-MM-DDTHH:mm:ss", TZ);
      const range = deriveRange("-1", "now", TZ, now);

      const hours = range.chartEndDate.diff(range.chartStartDate, "hour", true);
      expect(hours).toBeCloseTo(24);
    });

    it("produces an exact 48-hour window for from=-2&to=now", () => {
      const now = localDayJs.tz("2026-05-14T10:00:00", "YYYY-MM-DDTHH:mm:ss", TZ);
      const range = deriveRange("-2", "now", TZ, now);

      const hours = range.chartEndDate.diff(range.chartStartDate, "hour", true);
      expect(hours).toBeCloseTo(48);
    });

    it("falls back to default when from is a malformed negative literal", () => {
      const now = localDayJs.tz("2026-05-14T10:00:00", "YYYY-MM-DDTHH:mm:ss", TZ);
      const range = deriveRange("-abc", "now", TZ, now);

      expect(range.isNow).toBe(true);
      expect(range.chartStartDate.valueOf()).toBe(
        now.subtract(CHART_DEFAULT_RANGE_DAYS, "d").valueOf()
      );
    });

    it("does not interpret a positive integer string as relative", () => {
      // Only `-N` is the relative form. A bare integer is a malformed date.
      const now = localDayJs.tz("2026-05-14T10:00:00", "YYYY-MM-DDTHH:mm:ss", TZ);
      const range = deriveRange("7", "now", TZ, now);

      expect(range.isNow).toBe(true);
      expect(range.chartStartDate.valueOf()).toBe(
        now.subtract(CHART_DEFAULT_RANGE_DAYS, "d").valueOf()
      );
    });
  });
});
