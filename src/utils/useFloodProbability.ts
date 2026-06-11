import { useEffect, useState } from "react";

import { Gage } from "@models/Gage";
import { useStores } from "@models/helpers/useStores";
import {
  combineFloodChance,
  derivePredictorStageProbability,
} from "@services/floodPrediction/calculations";
import {
  getFloodProbability,
  getGaugeConstants,
} from "@services/floodPrediction/floodPredictionService";
import { FloodChanceResult, FloodProbabilityResult } from "@services/floodPrediction/types";

import { selectObservedPredictorStage } from "./observedFloodProbability";

/**
 * Combined flood chance for a gauge: the greater of the days-out forecast
 * (network-backed, cached) and the observed/nowcast probability derived from the
 * predictor's live measured stage. Returns null for gauges not covered by the
 * constants (or when called with no gauge).
 *
 * The observed half reads live MST data during render so the (observer) caller
 * recomputes reactively as readings update; the forecast half is async. Kept out
 * of MST so the bulky payloads never enter the persisted snapshot. Someday the
 * whole computation moves server-side behind this same return shape.
 */
export function useFloodProbability(gage?: Gage): FloodChanceResult | null {
  const { gagesStore, getTimezone } = useStores();
  const locationId = gage?.locationId;
  const constants = getGaugeConstants(locationId);

  const [forecast, setForecast] = useState<FloodProbabilityResult | null>(null);

  useEffect(() => {
    let active = true;

    if (locationId && getGaugeConstants(locationId)) {
      getFloodProbability(locationId)
        .then((r) => {
          if (active) {
            setForecast(r);
          }
        })
        .catch(() => {
          if (active) {
            setForecast(null);
          }
        });
    } else {
      setForecast(null);
    }

    return () => {
      active = false;
    };
  }, [locationId]);

  if (!gage || !constants) {
    return null;
  }

  // Observed/nowcast: choose a predictor stage from live readings and translate
  // it through the gauge's p50/p90/p99 constants.
  const predictor = gagesStore.getGageByLocationId(constants.predictor.floodzillaId);
  const observedStage = predictor
    ? selectObservedPredictorStage({
        gaugeRiverMile: Number(gage.riverMile),
        gaugeTrendValue: gage.status?.waterTrend?.trendValue ?? null,
        predictorRiverMile: Number(predictor.riverMile),
        predictorTrendValue: predictor.status?.waterTrend?.trendValue ?? null,
        predictorCurrentHeight: predictor.status?.lastReading?.waterHeight ?? null,
        predictorReadings: predictor.readings.map((r) => ({
          timestamp: r.timestamp,
          waterHeight: r.waterHeight,
        })),
        timezone: getTimezone(),
      })
    : null;

  const observedProbability =
    observedStage != null
      ? derivePredictorStageProbability(constants.floodProbability, observedStage)
      : null;

  return combineFloodChance({ forecast, observedProbability });
}
