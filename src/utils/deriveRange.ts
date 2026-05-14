import { Dayjs } from "dayjs";
import localDayJs from "@services/localDayJs";
import { parseUrlDate } from "./urlDates";

export const CHART_DEFAULT_RANGE_DAYS = 2;
export const NOW_LITERAL = "now";

export type Range = {
  chartStartDate: Dayjs;
  chartEndDate: Dayjs;
  isNow: boolean;
};

const RELATIVE_DAYS_RE = /^-(\d+)$/;

// Resolve a URL `from` value to a Dayjs (or null on malformed).
// Accepts: "-N" (N days back from now), YYYY-MM-DD, full ISO.
const resolveFrom = (str: string, tz: string, now: Dayjs): Dayjs | null => {
  const m = RELATIVE_DAYS_RE.exec(str);
  if (m) {
    return now.subtract(parseInt(m[1], 10), "d");
  }
  const parsed = parseUrlDate(str, tz);
  return parsed.isValid() ? parsed : null;
};

// Resolve a URL `to` value to { d, isNow } (or null on malformed).
// Accepts: "now" (live mode), YYYY-MM-DD, full ISO.
const resolveTo = (str: string, tz: string, now: Dayjs): { d: Dayjs; isNow: boolean } | null => {
  if (str === NOW_LITERAL) {
    return { d: now, isNow: true };
  }
  const parsed = parseUrlDate(str, tz);
  return parsed.isValid() ? { d: parsed, isNow: false } : null;
};

/**
 * Derive the chart's visible window from URL params.
 *
 * Live mode (preferred):
 *   - to="now" → isNow=true, end=now()
 *   - from="-N" → start = now − N days
 *
 * Historic mode:
 *   - both from/to are absolute dates, end < today in gauge tz → isNow=false
 *
 * Legacy auto-promotion: when both from/to are absolute and end ≥ today
 * in gauge tz, return live mode. This keeps old bookmarks working.
 *
 * Malformed params → default 2-day live-mode window.
 */
export const deriveRange = (
  from: string | undefined,
  to: string | undefined,
  tz: string,
  now: Dayjs = localDayJs()
): Range => {
  const defaultRange: Range = {
    chartStartDate: now.subtract(CHART_DEFAULT_RANGE_DAYS, "d"),
    chartEndDate: now,
    isNow: true,
  };

  if (!from || !to) {
    return defaultRange;
  }

  const start = resolveFrom(from, tz, now);
  const end = resolveTo(to, tz, now);

  if (!start || !end) {
    return defaultRange;
  }

  if (end.isNow) {
    return {
      chartStartDate: start,
      chartEndDate: end.d,
      isNow: true,
    };
  }

  // Both from and to are absolute dates. Snap to day boundaries.
  const startOfDay = start.tz(tz).startOf("day");
  const endOfDay = end.d.tz(tz).endOf("day");
  const todayEndInTz = now.tz(tz).endOf("day");

  if (endOfDay.valueOf() >= todayEndInTz.valueOf()) {
    return {
      chartStartDate: startOfDay,
      chartEndDate: now,
      isNow: true,
    };
  }

  return {
    chartStartDate: startOfDay,
    chartEndDate: endOfDay,
    isNow: false,
  };
};
