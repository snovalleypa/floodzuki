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
 *  - `floodRows`: covered gauges with no road, OR road gauges whose red stage
 *    differs from the road saddle (threshold = red flood stage). A "type 2" road
 *    gauge (red ≠ saddle) therefore appears in both cards; a "type 1" gauge
 *    (red = saddle) appears only in the road card.
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
      if (!sameStage(gage.redStage, gage.roadSaddleHeight)) {
        floodRows.push(gage);
      }
    } else {
      floodRows.push(gage);
    }
  }

  return { roadRows, floodRows };
}
