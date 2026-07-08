import { useEffect, useState } from "react";

import { Gage } from "@models/Gage";
import { useStores } from "@models/helpers/useStores";
import {
  combineFloodChance,
  derivePredictorStageProbability,
  shiftFloodProbabilityConstants,
} from "@services/floodPrediction/calculations";
import { getDirectGaugeConstants } from "@services/floodPrediction/directGauges";
import {
  getCachedFloodProbability,
  getFloodProbability,
  getGaugeConstants,
} from "@services/floodPrediction/floodPredictionService";
import { FloodChanceResult } from "@services/floodPrediction/types";

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
export function useFloodProbability(
  gage?: Gage,
  thresholdOverride?: number
): FloodChanceResult | null {
  const { gagesStore, getTimezone } = useStores();
  const locationId = gage?.locationId;
  const constants = getGaugeConstants(locationId);
  const direct = getDirectGaugeConstants(locationId);
  // Direct USGS gauges read their own red stage as the forecast threshold, unless
  // an explicit threshold (e.g. a road saddle) is supplied.
  const redStage = gage?.redStage;
  const directThreshold = thresholdOverride ?? redStage;

  // The resolved forecast lives in a module-level cache (below) so it surfaces on
  // any render. This local state is only a re-render nudge for when the async
  // fetch lands — never the source of truth — so a virtualized row whose effect
  // is torn down before the fetch resolves still shows the value on its next
  // render (e.g. the always-present map pin warms the cache first).
  const [, bumpTick] = useState(0);

  useEffect(() => {
    let active = true;
    const done = () => {
      if (active) {
        bumpTick((t) => t + 1);
      }
    };

    if (locationId && getGaugeConstants(locationId)) {
      getFloodProbability(locationId, thresholdOverride).then(done).catch(done);
    } else if (locationId && getDirectGaugeConstants(locationId) && directThreshold != null) {
      getFloodProbability(locationId, directThreshold).then(done).catch(done);
    }

    return () => {
      active = false;
    };
  }, [locationId, directThreshold, thresholdOverride]);

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
        ? derivePredictorStageProbability(
            shiftFloodProbabilityConstants(
              constants.floodProbability,
              constants.regression.slope,
              thresholdOverride
            ),
            observedStage
          )
        : null;
  }

  // Read the forecast synchronously from the shared cache, keyed to match how the
  // effect requested it (SVPA: locationId; direct USGS: locationId + red stage).
  const forecast = constants
    ? getCachedFloodProbability(locationId, thresholdOverride) ?? null
    : getCachedFloodProbability(locationId, directThreshold) ?? null;

  return combineFloodChance({ forecast, observedProbability });
}
