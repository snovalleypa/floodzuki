import { Dayjs } from "dayjs";
import localDayJs from "@services/localDayJs";
import { Gage } from "@models/Gage";

export type CrossingThresholdKind = "road" | "flood";

export interface ThresholdCrossing {
  time: Dayjs;
  kind: CrossingThresholdKind;
}

type PredictionPoint = { timestamp: string; waterHeight?: number | null };

/** Interpolate the time the prediction series crosses `level`, or null. */
function interpolateCrossing(
  predictions: PredictionPoint[],
  level: number,
  tz: string
): Dayjs | null {
  const toGaugeTime = (s: string) => localDayJs.tz(s, "YYYY-MM-DDTHH:mm:ss", tz);

  for (let i = 0; i < predictions.length - 1; i++) {
    const p = predictions[i];
    const pNext = predictions[i + 1];

    if (p.waterHeight == null || pNext.waterHeight == null) {
      continue;
    }

    if (pNext.waterHeight === level) {
      return toGaugeTime(pNext.timestamp);
    }

    if (
      (pNext.waterHeight > level && level > p.waterHeight) ||
      (pNext.waterHeight < level && level < p.waterHeight)
    ) {
      const waterDelta = (level - p.waterHeight) / (pNext.waterHeight - p.waterHeight);
      const msec = toGaugeTime(pNext.timestamp).diff(toGaugeTime(p.timestamp)) * waterDelta;
      return toGaugeTime(p.timestamp).add(msec, "milliseconds");
    }
  }

  return null;
}

/**
 * Predicted time the trend line crosses the gauge's relevant threshold — the
 * road saddle when the gauge has a road, otherwise the flood (red) stage — by
 * interpolating between consecutive prediction points. Returns null when there's
 * no threshold, no predictions, or no crossing within the predicted window.
 */
export function computeThresholdCrossing(gage: Gage, tz: string): ThresholdCrossing | null {
  const hasRoad = gage?.roadSaddleHeight != null && !!gage?.roadDisplayName;
  const level = hasRoad ? gage.roadSaddleHeight : gage?.redStage;

  if (level == null || !gage?.predictions?.length) {
    return null;
  }

  const time = interpolateCrossing(gage.predictions, level, tz);
  return time ? { time, kind: hasRoad ? "road" : "flood" } : null;
}
