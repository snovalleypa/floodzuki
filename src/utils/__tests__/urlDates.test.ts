import localDayJs from "@services/localDayJs";
import { parseUrlDate, formatUrlDate, UTC_ISO_FORMAT, LOCAL_ISO_FORMAT } from "../urlDates";

// Tz-invariant behaviors are parameterized across a westward, eastward, and
// far-east tz. Tz-specific arithmetic (UTC offset conversion, day-boundary
// shifts) is asserted in dedicated blocks below where the expected clock
// values depend on the tz.
const TZ_CASES = [["America/Los_Angeles"], ["America/New_York"], ["Pacific/Auckland"]] as const;

describe.each(TZ_CASES)("urlDates [%s]", (TZ) => {
  describe("parseUrlDate", () => {
    it("parses YYYY-MM-DD as midnight in the gauge timezone", () => {
      const d = parseUrlDate("2020-05-01", TZ);
      expect(d.tz(TZ).format("YYYY-MM-DD HH:mm:ss")).toBe("2020-05-01 00:00:00");
    });

    it("parses YYYY-MM-DDTHH:mm:ss (no offset) as gauge-local wall clock", () => {
      const d = parseUrlDate("2020-05-01T10:30:00", TZ);
      expect(d.tz(TZ).format("YYYY-MM-DD HH:mm:ss")).toBe("2020-05-01 10:30:00");
    });

    it("returns an invalid Dayjs for unparseable input", () => {
      // Contract relied on by deriveRange's isValid() check.
      const d = parseUrlDate("not-a-date", TZ);
      expect(d.isValid()).toBe(false);
    });
  });

  describe("formatUrlDate", () => {
    it("formats a tz-naive midnight in gauge tz as that calendar day", () => {
      const d = localDayJs.tz("2020-05-01", "YYYY-MM-DD", TZ).startOf("day");
      expect(formatUrlDate(d, TZ)).toBe("2020-05-01");
    });
  });

  describe("format constants", () => {
    it("LOCAL_ISO_FORMAT has no offset", () => {
      const d = localDayJs.tz("2020-05-01T10:30:00", "YYYY-MM-DDTHH:mm:ss", TZ);
      expect(d.format(LOCAL_ISO_FORMAT)).toBe("2020-05-01T10:30:00");
    });
  });
});

// ---------------------------------------------------------------------------
// Tz-specific arithmetic — these assertions hardcode the UTC offset of one
// timezone and must be split per tz.
// ---------------------------------------------------------------------------
describe("urlDates — UTC instant conversions", () => {
  it("parseUrlDate: Z suffix is UTC and converts to PDT (UTC-7)", () => {
    // 2020-05-01T10:30:00Z = 2020-05-01 03:30 in PDT
    const d = parseUrlDate("2020-05-01T10:30:00Z", "America/Los_Angeles");
    expect(d.tz("America/Los_Angeles").format("YYYY-MM-DD HH:mm:ss")).toBe("2020-05-01 03:30:00");
  });

  it("parseUrlDate: Z suffix converts correctly to EDT (UTC-4) too", () => {
    // Same UTC instant, different gauge tz — verifies parseUrlDate isn't
    // hardcoded to a specific offset.
    const d = parseUrlDate("2020-05-01T10:30:00Z", "America/New_York");
    expect(d.tz("America/New_York").format("YYYY-MM-DD HH:mm:ss")).toBe("2020-05-01 06:30:00");
  });

  it("parseUrlDate: explicit +00:00 offset is treated as UTC", () => {
    const d = parseUrlDate("2020-05-01T10:30:00+00:00", "America/Los_Angeles");
    expect(d.tz("America/Los_Angeles").format("YYYY-MM-DD HH:mm:ss")).toBe("2020-05-01 03:30:00");
  });

  it("formatUrlDate: emits the gauge-tz calendar day even when UTC day differs", () => {
    // 2020-05-02 06:00 UTC = 2020-05-01 23:00 PDT — must output the PDT date.
    const d = localDayJs.utc("2020-05-02T06:00:00Z");
    expect(formatUrlDate(d, "America/Los_Angeles")).toBe("2020-05-01");
    // Same instant in NY (UTC-4) is 2020-05-02 02:00 — date stays "2020-05-02".
    expect(formatUrlDate(d, "America/New_York")).toBe("2020-05-02");
  });

  it("UTC_ISO_FORMAT produces a literal Z suffix", () => {
    const d = localDayJs.utc("2020-05-01T10:30:00Z");
    expect(d.format(UTC_ISO_FORMAT)).toBe("2020-05-01T10:30:00Z");
  });
});
