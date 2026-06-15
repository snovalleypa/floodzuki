import { Gage } from "@models/Gage";
import { floodChanceRiskLevel } from "@services/floodPrediction/calculations";
import { FloodRiskLevel } from "@services/floodPrediction/types";

import { useFloodProbability } from "./useFloodProbability";
import { isNullish } from "./utils";

/**
 * True when the latest reading is already at or above an arbitrary threshold
 * height — it's flooding (for that threshold) now, so a forward-looking "chance of
 * flooding" is moot. The threshold is a red stage, a road saddle, etc.
 */
export function isAtOrAboveThreshold(
  waterHeight?: number | null,
  threshold?: number | null
): boolean {
  return (
    !isNullish(waterHeight) &&
    !isNullish(threshold) &&
    (waterHeight as number) >= (threshold as number)
  );
}

/**
 * True when the latest reading is already at or above the gauge's red stage.
 * Shared by the gauge details card and the gauge list so they gate the badge
 * identically. Thin wrapper over {@link isAtOrAboveThreshold}.
 */
export function isAtOrAboveRedStage(
  waterHeight?: number | null,
  redStage?: number | null
): boolean {
  return isAtOrAboveThreshold(waterHeight, redStage);
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
