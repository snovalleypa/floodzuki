import { FloodChanceLevel } from "@services/floodPrediction/types";
import { TxKeyPath } from "@i18n/i18n";

type TFn = (key: TxKeyPath, options?: Record<string, unknown>) => string;

/**
 * Map a combined flood-chance bucket to its display string. Shared by the
 * gauge-details callout card and the forecast flood-probability cards so the
 * vocabulary lives in one place. The caller supplies its own row label / window
 * text; this returns only the chance value ("Low", "45%", ">90%", etc.).
 *
 * Forecast tops out at the clamped "veryHighClamp" (>90%) bucket; the precise
 * observed path reaches the exact "veryHigh" and "nearCertain" (>=99%) buckets.
 */
export function formatFloodChanceLabel(chance: FloodChanceLevel, t: TFn): string {
  switch (chance.level) {
    case "low":
      return t("calloutReading.floodChanceLow" as TxKeyPath);
    case "percent":
      return `${chance.percent}%`;
    case "veryHighClamp":
      return t("calloutReading.floodChanceVeryHigh" as TxKeyPath);
    case "veryHigh":
      return t("calloutReading.floodChanceVeryHighExact" as TxKeyPath, {
        percent: chance.percent,
      });
    case "nearCertain":
      return t("calloutReading.floodChanceNearCertain" as TxKeyPath);
  }
}
