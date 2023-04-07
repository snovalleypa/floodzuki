/**
 * Time Format function
 * relies on the default timezone set in the Region.ts model
 */

import localDayJs from "@services/localDayJs"
import dayjs from "dayjs";

export const formatDateTime = (time: string | dayjs.Dayjs) => {
  const result = typeof time === "string" ?
    localDayJs.tz(time).format("ddd M/D hh:mm a") :
    time?.format("ddd M/D hh:mm a");

  return result;
}

export const formatReadingTime = (timestamp: string) => {
  if (!timestamp) return "";

  const timeAgo = localDayJs() - localDayJs.tz(timestamp);
  
  let formatString;
  
  if (timeAgo < localDayJs.duration(12, "h").asMilliseconds()) {
    formatString = "h:mm a";
  } else if (timeAgo < localDayJs.duration(2, "months").asMilliseconds()) {
    formatString = "ddd MM/DD h:mm a";
  } else {
    formatString = "YYYY/MM/DD h:mm a";
  }

  return localDayJs.tz(timestamp).format(formatString);
}
