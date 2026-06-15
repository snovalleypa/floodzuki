import { Gage } from "@models/Gage";
import { getDirectGaugeConstants } from "@services/floodPrediction/directGauges";
import { getGaugeConstants } from "@services/floodPrediction/floodPredictionService";

function isCovered(locationId?: string): boolean {
  return !!getGaugeConstants(locationId) || !!getDirectGaugeConstants(locationId);
}

/** Two stages are "the same" at the display precision used across the app (2 dp). */
function sameStage(a?: number, b?: number): boolean {
  return a != null && b != null && a.toFixed(2) === b.toFixed(2);
}

/**
 * Split the (river-ordered) gauges into the two Forecast-tab flood cards:
 *  - `roadRows`: covered gauges that have a road (threshold = road saddle height).
 *  - `floodRows`: covered gauges that have a red stage (the flood-stage threshold)
 *    AND are either roadless or a "type 2" road gauge whose red stage differs from
 *    the road saddle. A "type 2" gauge therefore appears in both cards; a "type 1"
 *    gauge (red = saddle) appears only in the road card.
 *
 * A gauge with no red stage (e.g. the downstream Snohomish-at-Monroe gauge, which
 * has HEFS bands but no SVPA flood stage) is never placed in the flood card: there
 * is no threshold to compute against, and an uncomputable row would spin forever.
 *
 * Input order is preserved so each card stays in gauge-list (upstream →
 * downstream) order. Gauges with no flood-prediction coverage are dropped.
 */
export function selectCardMembership(gages: Gage[]): { roadRows: Gage[]; floodRows: Gage[] } {
  const roadRows: Gage[] = [];
  const floodRows: Gage[] = [];

  for (const gage of gages) {
    if (!isCovered(gage?.locationId)) {
      continue;
    }
    if (gage.hasRoads) {
      roadRows.push(gage);
    }
    // The flood-stage row's threshold is the red stage — skip gauges that have
    // none. A road gauge whose red stage equals its road saddle is already covered
    // by its road row.
    const redDiffersFromSaddle = !gage.hasRoads || !sameStage(gage.redStage, gage.roadSaddleHeight);
    if (gage.redStage != null && redDiffersFromSaddle) {
      floodRows.push(gage);
    }
  }

  return { roadRows, floodRows };
}
