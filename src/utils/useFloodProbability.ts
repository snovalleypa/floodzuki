import { useEffect, useState } from "react";

import { Gage } from "@models/Gage";
import { useStores } from "@models/helpers/useStores";
import {
  combineFloodChance,
  derivePredictorStageProbability,
} from "@services/floodPrediction/calculations";
import { getDirectGaugeConstants } from "@services/floodPrediction/directGauges";
import {
  getFloodProbability,
  getGaugeConstants,
} from "@services/floodPrediction/floodPredictionService";
import { FloodChanceResult, FloodProbabilityResult } from "@services/floodPrediction/types";

import { selectObservedPredictorStage } from "./observedFloodProbability";

/**
 * Combined flood chance for a gauge. Two kinds of coverage:
 *  - SVPA gauge (generated constants): the greater of the days-out forecast
 *    (network-backed, cached) and the observed/nowcast probability derived from
 *    the predictor's live measured stage.
 *  - Direct USGS gauge (hand-maintained registry): forecast-only — P(reach its
 *    own red stage) from its own HEFS 5/10-day exceedance curve.
 * Returns null for gauges covered by neither (or when called with no gauge).
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
  const direct = getDirectGaugeConstants(locationId);
  // Direct USGS gauges read their own red stage as the forecast threshold.
  const redStage = gage?.redStage;

  const [forecast, setForecast] = useState<FloodProbabilityResult | null>(null);

  useEffect(() => {
    let active = true;
    const apply = (r: FloodProbabilityResult | null) => {
      if (active) {
        setForecast(r);
      }
    };

    if (locationId && getGaugeConstants(locationId)) {
      getFloodProbability(locationId)
        .then(apply)
        .catch(() => apply(null));
    } else if (locationId && getDirectGaugeConstants(locationId) && redStage != null) {
      getFloodProbability(locationId, redStage)
        .then(apply)
        .catch(() => apply(null));
    } else {
      setForecast(null);
    }

    return () => {
      active = false;
    };
  }, [locationId, redStage]);

  if (!gage || (!constants && !direct)) {
    return null;
  }

  // Observed/nowcast blend applies only to SVPA gauges (which have the predictor
  // p50/p90/p99 distribution). Direct USGS gauges are forecast-only.
  let observedProbability: number | null = null;
  if (constants) {
    // Choose a predictor stage from live readings and translate it through the
    // gauge's p50/p90/p99 constants.
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

    observedProbability =
      observedStage != null
        ? derivePredictorStageProbability(constants.floodProbability, observedStage)
        : null;
  }

  return combineFloodChance({ forecast, observedProbability });
}
