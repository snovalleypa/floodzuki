import localDayJs from "@services/localDayJs";
import { formatDateTime, formatReadingTime } from "../useTimeFormat";

describe("formatDateTime", () => {
  it("converts UTC timestamp to Pacific time", () => {
    // 2024-01-15T20:00:00Z = 12:00 PM PST (UTC-8)
    const result = formatDateTime("2024-01-15T20:00:00Z", "America/Los_Angeles");
    expect(result).toContain("12:00 pm");
  });

  it("converts UTC timestamp to the specified timezone, not the default fallback", () => {
    // 2024-07-04T19:00:00Z = 3:00 PM EDT (UTC-4)
    // If tz param is ignored and Pacific fallback is used, result would be "12:00 pm" (PDT)
    const result = formatDateTime("2024-07-04T19:00:00Z", "America/New_York");
    expect(result).toContain("3:00 pm");
  });
});

describe("formatReadingTime", () => {
  // The suite runs under TZ=UTC (set in package.json), so picking a non-UTC
  // gauge tz here proves the function uses the explicit tz, not the system tz.
  const TZ = "America/New_York";

  it("returns empty string for empty input", () => {
    expect(formatReadingTime("", TZ)).toBe("");
  });

  it("uses gauge-tz elapsed time to choose format bucket, not system tz", () => {
    // A reading 11 hours ago in NY is in the "h:mm a" bucket (< 12h).
    // Under TZ=UTC, an impl that parses the naive string as system-tz wall
    // clock will see this moment as 15 hours ago (11h + the EDT→UTC offset
    // shift) and bucket it as "ddd MM/DD h:mm a" instead. This is the
    // user-visible cross-tz bug.
    const timestamp = localDayJs().tz(TZ).subtract(11, "hours").format("YYYY-MM-DDTHH:mm:ss");
    expect(formatReadingTime(timestamp, TZ)).toMatch(/^\d{1,2}:\d{2} (am|pm)$/);
  });

  it("shows time only for timestamps less than 12 hours ago", () => {
    const timestamp = localDayJs().tz(TZ).subtract(2, "hours").format("YYYY-MM-DDTHH:mm:ss");
    expect(formatReadingTime(timestamp, TZ)).toMatch(/^\d{1,2}:\d{2} (am|pm)$/);
  });

  it("shows day and date for timestamps between 12 hours and 2 months ago", () => {
    const timestamp = localDayJs().tz(TZ).subtract(3, "days").format("YYYY-MM-DDTHH:mm:ss");
    expect(formatReadingTime(timestamp, TZ)).toMatch(/^\w{3} \d{2}\/\d{2} \d{1,2}:\d{2} (am|pm)$/);
  });

  it("shows full date for timestamps more than 2 months ago", () => {
    const timestamp = localDayJs().tz(TZ).subtract(6, "months").format("YYYY-MM-DDTHH:mm:ss");
    expect(formatReadingTime(timestamp, TZ)).toMatch(/^\d{4}\/\d{2}\/\d{2} \d{1,2}:\d{2} (am|pm)$/);
  });
});
