/**
 * Time format functions.
 * formatDateTime requires an explicit tz string — pass rootStore.getTimezone().
 * Times represent physical readings at a gauge location, not the client's timezone.
 */

import localDayJs from "@services/localDayJs";
import dayjs from "dayjs";

export const formatDateTime = (time: string | dayjs.Dayjs, tz: string) => {
  const result =
    typeof time === "string"
      ? localDayJs(time).tz(tz).format("ddd M/D h:mm a")
      : time?.tz(tz).format("ddd M/D h:mm a");

  return result;
};

export const formatReadingTime = (timestamp: string, tz: string) => {
  if (!timestamp) {
    return "";
  }

  // API timestamps arrive without offset information — they are wall-clock
  // times at the gauge. Interpret them in the gauge tz so both the elapsed-
  // time bucketing and the formatted output are correct regardless of the
  // viewer's system tz.
  const time = localDayJs.tz(timestamp, "YYYY-MM-DDTHH:mm:ss", tz);

  const timeAgo = localDayJs().valueOf() - time.valueOf();

  let formatString;

  if (timeAgo < localDayJs.duration(12, "h").asMilliseconds()) {
    formatString = "h:mm a";
  } else if (timeAgo < localDayJs.duration(2, "months").asMilliseconds()) {
    formatString = "ddd MM/DD h:mm a";
  } else {
    formatString = "YYYY/MM/DD h:mm a";
  }

  return time.format(formatString);
};
