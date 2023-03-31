/**
 * Time Format function
 * relies on the default timezone set in the Region.ts model
 */

import localDayJs from "@services/localDayJs"

export const formatDateTime = (time: string) => {
  const result = localDayJs.tz(time).format("ddd M/D hh:mm a")

  return result;
}

export const formatReadingTime = (timeZone: string, timestamp: string) => {
  const timeAgo = localDayJs() - localDayJs.tz(timestamp, timeZone);
  
  let formatString;
  
  if (timeAgo < localDayJs.duration(12, "h").asMilliseconds()) {
    formatString = "h:mm a";
  } else if (timeAgo < localDayJs.duration(2, "months").asMilliseconds()) {
    formatString = "ddd MM/DD h:mm a";
  } else {
    formatString = "YYYY/MM/DD h:mm a";
  }
  return localDayJs(timestamp).format(formatString);
}
