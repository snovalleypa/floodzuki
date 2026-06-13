import { Gage } from "@models/Gage";
import { floodChanceRiskLevel } from "@services/floodPrediction/calculations";
import { FloodRiskLevel } from "@services/floodPrediction/types";

import { useFloodProbability } from "./useFloodProbability";
import { isNullish } from "./utils";

/**
 * True when the latest reading is already at or above the gauge's red stage —
 * it's flooding now, so a forward-looking "chance of flooding" is moot. Shared by
 * the gauge details card and the gauge list so they gate the badge identically.
 */
export function isAtOrAboveRedStage(
  waterHeight?: number | null,
  redStage?: number | null
): boolean {
  return (
    !isNullish(waterHeight) &&
    !isNullish(redStage) &&
    (waterHeight as number) >= (redStage as number)
  );
}

/**
 * Risk level for the gauge's chance-of-flooding badge, or null when no badge
 * should show (gauge not covered by the prediction constants, already flooding,
 * or Low risk). Used by the gauge list; the details screen derives its risk from
 * the FloodChanceResult it already holds (it needs the percentage too).
 */
export function useFloodRiskLevel(gage?: Gage): FloodRiskLevel | null {
  const reading = gage?.lastReading;
  const flooding = isAtOrAboveRedStage(reading?.waterHeight, gage?.redStage);
  const floodChance = useFloodProbability(flooding ? undefined : gage);
  if (!floodChance) {
    return null;
  }
  const level = floodChanceRiskLevel(floodChance.chance);
  return level === FloodRiskLevel.Low ? null : level;
}
