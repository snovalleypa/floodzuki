/**
 * Time Format function
 * relies on the default timezone set in the Region.ts model
 */

import localDayJs from "@services/localDayJs"

export const formatDateTime = (time: string) => {
  const result = localDayJs.tz(time).format("ddd M/D hh:mm a")

  return result;
}
