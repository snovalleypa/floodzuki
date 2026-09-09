// src/services/mockReplay/timestamps.ts
import localDayJs from "@services/localDayJs";

/** Format an epoch-ms instant as a naive gauge-local "YYYY-MM-DDTHH:mm:ss". */
export function toGaugeLocalString(instantMs: number, tz: string): string {
  return localDayJs(instantMs).tz(tz).format("YYYY-MM-DDTHH:mm:ss");
}
