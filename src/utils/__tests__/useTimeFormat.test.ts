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
  it("returns empty string for empty input", () => {
    expect(formatReadingTime("")).toBe("");
  });

  it("shows time only for timestamps less than 12 hours ago", () => {
    // Timestamps arrive without timezone (already local), so subtract from localDayJs()
    const timestamp = localDayJs().subtract(2, "hours").format("YYYY-MM-DDTHH:mm:ss");
    // Format: h:mm a — e.g. "2:30 pm"
    expect(formatReadingTime(timestamp)).toMatch(/^\d{1,2}:\d{2} (am|pm)$/);
  });

  it("shows day and date for timestamps between 12 hours and 2 months ago", () => {
    const timestamp = localDayJs().subtract(3, "days").format("YYYY-MM-DDTHH:mm:ss");
    // Format: ddd MM/DD h:mm a — e.g. "Mon 04/19 2:30 pm"
    expect(formatReadingTime(timestamp)).toMatch(/^\w{3} \d{2}\/\d{2} \d{1,2}:\d{2} (am|pm)$/);
  });

  it("shows full date for timestamps more than 2 months ago", () => {
    const timestamp = localDayJs().subtract(6, "months").format("YYYY-MM-DDTHH:mm:ss");
    // Format: YYYY/MM/DD h:mm a — e.g. "2023/10/15 2:30 pm"
    expect(formatReadingTime(timestamp)).toMatch(/^\d{4}\/\d{2}\/\d{2} \d{1,2}:\d{2} (am|pm)$/);
  });
});
