import { Dayjs } from "dayjs";
import localDayJs from "@services/localDayJs";
import { Gage } from "@models/Gage";

/**
 * Predicted time the trend line crosses the road saddle, by interpolating
 * between consecutive prediction points. Returns null when there's no road,
 * no predictions, or the road isn't crossed within the predicted window.
 */
export function computeRoadCrossing(gage: Gage, tz: string): Dayjs | null {
  const road = gage?.roadSaddleHeight;
  if (!road || !gage?.predictions?.length) {
    return null;
  }

  const toGaugeTime = (s: string) => localDayJs.tz(s, "YYYY-MM-DDTHH:mm:ss", tz);

  for (let i = 0; i < gage.predictions.length - 1; i++) {
    const p = gage.predictions[i];
    const pNext = gage.predictions[i + 1];

    if (p.waterHeight == null || pNext.waterHeight == null) {
      continue;
    }

    if (pNext.waterHeight === road) {
      return toGaugeTime(pNext.timestamp);
    }

    if (
      (pNext.waterHeight > road && road > p.waterHeight) ||
      (pNext.waterHeight < road && road < p.waterHeight)
    ) {
      const waterDelta = (road - p.waterHeight) / (pNext.waterHeight - p.waterHeight);
      const msec = toGaugeTime(pNext.timestamp).diff(toGaugeTime(p.timestamp)) * waterDelta;
      return toGaugeTime(p.timestamp).add(msec, "milliseconds");
    }
  }

  return null;
}
