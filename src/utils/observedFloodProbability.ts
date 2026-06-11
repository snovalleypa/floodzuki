import localDayJs from "@services/localDayJs";

interface PredictorReading {
  timestamp?: string;
  waterHeight?: number | null;
}

function parseGaugeTime(timestamp: string, timezone: string): number {
  return localDayJs.tz(timestamp, "YYYY-MM-DDTHH:mm:ss", timezone).valueOf();
}

/**
 * Max measured height within the last `nHours` of the predictor's readings,
 * measured back from the latest reading. Returns null when no reading qualifies.
 */
function maxHeightInLastNHours(
  readings: PredictorReading[],
  nHours: number,
  timezone: string
): number | null {
  const times = readings
    .filter((r) => r.timestamp != null && r.waterHeight != null)
    .map((r) => ({
      at: parseGaugeTime(r.timestamp as string, timezone),
      height: r.waterHeight as number,
    }));

  if (times.length === 0) {
    return null;
  }

  const latest = Math.max(...times.map((t) => t.at));
  const threshold = latest - nHours * 60 * 60 * 1000;

  let max: number | null = null;
  for (const t of times) {
    if (t.at >= threshold && (max === null || t.height > max)) {
      max = t.height;
    }
  }
  return max;
}

/**
 * Pick the predictor stage to translate into an observed flood probability, per
 * the crest-tracking rules:
 *
 *  - Evaluated gauge falling (trend < 0): crest has passed → no observed value.
 *  - Predictor downstream of the gauge (lower river mile): use current height.
 *  - Predictor upstream (>= river mile):
 *      - rising (trend > 0): use current height;
 *      - flat or falling (trend <= 0): use the max over the last
 *        N = 2 × |predictorRiverMile − gaugeRiverMile| hours.
 *
 * River mile is the locationId number (higher = farther upstream). Returns null
 * when the gauge is falling or the predictor has no current height.
 */
export function selectObservedPredictorStage(args: {
  gaugeRiverMile: number;
  gaugeTrendValue: number | null;
  predictorRiverMile: number;
  predictorTrendValue: number | null;
  predictorCurrentHeight: number | null;
  predictorReadings: PredictorReading[];
  timezone: string;
}): number | null {
  const {
    gaugeRiverMile,
    gaugeTrendValue,
    predictorRiverMile,
    predictorTrendValue,
    predictorCurrentHeight,
    predictorReadings,
    timezone,
  } = args;

  // Gauge already cresting/receding — the predictor no longer informs it.
  if (gaugeTrendValue != null && gaugeTrendValue < 0) {
    return null;
  }
  if (predictorCurrentHeight == null) {
    return null;
  }

  // Predictor downstream of the gauge → its current value.
  if (predictorRiverMile < gaugeRiverMile) {
    return predictorCurrentHeight;
  }

  // Predictor upstream, rising → current value.
  if (predictorTrendValue != null && predictorTrendValue > 0) {
    return predictorCurrentHeight;
  }

  // Predictor upstream, flat or falling → recent peak over the travel window.
  const nHours = 2 * Math.abs(predictorRiverMile - gaugeRiverMile);
  return maxHeightInLastNHours(predictorReadings, nHours, timezone) ?? predictorCurrentHeight;
}
