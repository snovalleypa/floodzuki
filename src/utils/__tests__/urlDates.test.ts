import localDayJs from "@services/localDayJs";
import { parseUrlDate, formatUrlDate, UTC_ISO_FORMAT, LOCAL_ISO_FORMAT } from "../urlDates";

const TZ = "America/Los_Angeles";

describe("urlDates", () => {
  describe("parseUrlDate", () => {
    it("parses YYYY-MM-DD as midnight in the gauge timezone", () => {
      const d = parseUrlDate("2020-05-01", TZ);
      expect(d.tz(TZ).format("YYYY-MM-DD HH:mm:ss")).toBe("2020-05-01 00:00:00");
    });

    it("parses YYYY-MM-DDTHH:mm:ss (no offset) as gauge-local wall clock", () => {
      const d = parseUrlDate("2020-05-01T10:30:00", TZ);
      expect(d.tz(TZ).format("YYYY-MM-DD HH:mm:ss")).toBe("2020-05-01 10:30:00");
    });

    it("parses full ISO with Z suffix as UTC and converts to gauge tz", () => {
      // 2020-05-01T10:30:00Z = 2020-05-01 03:30 in PDT (UTC-7)
      const d = parseUrlDate("2020-05-01T10:30:00Z", TZ);
      expect(d.tz(TZ).format("YYYY-MM-DD HH:mm:ss")).toBe("2020-05-01 03:30:00");
    });

    it("parses full ISO with explicit offset", () => {
      const d = parseUrlDate("2020-05-01T10:30:00+00:00", TZ);
      expect(d.tz(TZ).format("YYYY-MM-DD HH:mm:ss")).toBe("2020-05-01 03:30:00");
    });

    it("returns an invalid Dayjs for unparseable input", () => {
      // Contract relied on by deriveRange's isValid() check.
      const d = parseUrlDate("not-a-date", TZ);
      expect(d.isValid()).toBe(false);
    });
  });

  describe("formatUrlDate", () => {
    it("formats a Dayjs as YYYY-MM-DD in the gauge timezone", () => {
      // 2020-05-02 06:00 UTC = 2020-05-01 23:00 in PDT — should output the PDT date
      const d = localDayJs.utc("2020-05-02T06:00:00Z");
      expect(formatUrlDate(d, TZ)).toBe("2020-05-01");
    });

    it("formats a tz-naive midnight in gauge tz as that calendar day", () => {
      const d = localDayJs.tz("2020-05-01", "YYYY-MM-DD", TZ).startOf("day");
      expect(formatUrlDate(d, TZ)).toBe("2020-05-01");
    });
  });

  describe("format constants", () => {
    it("UTC_ISO_FORMAT produces a literal Z suffix", () => {
      const d = localDayJs.utc("2020-05-01T10:30:00Z");
      expect(d.format(UTC_ISO_FORMAT)).toBe("2020-05-01T10:30:00Z");
    });

    it("LOCAL_ISO_FORMAT has no offset", () => {
      const d = localDayJs.tz("2020-05-01T10:30:00", "YYYY-MM-DDTHH:mm:ss", TZ);
      expect(d.format(LOCAL_ISO_FORMAT)).toBe("2020-05-01T10:30:00");
    });
  });
});
