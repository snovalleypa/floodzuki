/**
 * Mock NOAA HEFS map-quantiles for verifying the flood-probability UX out of
 * season (when live forecasts show no flood risk). Enabled via debug flags:
 *
 *   ?debug=mockFloodMajorIn5Days      major flood — every modeled gauge floods
 *   ?debug=mockFloodModerateIn5Days   moderate flood — a gradient across gauges
 *   ?debug=reset                      clear
 *
 * Each scenario is anchored on the observed peak flow of a real 2022 event at
 * the two predictor sites (Carnation/CRNW1, Falls/SQUW1), with a forecast spread
 * applied around the median (0.5) exceedance:
 *
 *   March 2022 (2022-03-01 peaks): Carnation 46,900 CFS, Falls 38,500 CFS
 *   Jan 21 2022 (2022-01-21 peaks): Carnation 20,100 CFS, Falls 16,500 CFS
 *
 * The Jan 21 event is the interesting one: its peak sits between gauge flood
 * thresholds, so probabilities range from ~90% down to "Low (<10%)".
 */
import { DebugFlag, getDebugFlag } from "@utils/debugFlags";
import * as mockReplayEngine from "@services/mockReplay/engine";

import { MapQuantiles } from "./types";

const EXCEEDANCES = [0.1, 0.25, 0.3, 0.5, 0.7, 0.75, 0.9];

// Forecast spread multipliers applied to the observed peak (= 0.5 exceedance),
// aligned to EXCEEDANCES: less-likely (0.1) runs higher, more-likely (0.9) lower.
const SPREAD = [1.25, 1.12, 1.08, 1.0, 0.88, 0.85, 0.72];

function flowsFromPeak(peakCfs: number): number[] {
  return SPREAD.map((m) => Math.round(peakCfs * m));
}

// Ordered by precedence; the first active flag wins. Keyed by NOAA site id.
const SCENARIOS: { flag: DebugFlag; peaksBySite: Record<string, number> }[] = [
  {
    flag: DebugFlag.MockFloodMajorIn5Days,
    peaksBySite: { CRNW1: 46900, SQUW1: 38500 },
  },
  {
    flag: DebugFlag.MockFloodModerateIn5Days,
    peaksBySite: { CRNW1: 20100, SQUW1: 16500 },
  },
];

function toMapQuantiles(peakCfs: number): MapQuantiles {
  const flows = flowsFromPeak(peakCfs);
  // An imminent flood peak falls inside both windows, so 5- and 10-day match.
  return {
    exceedanceQuantiles: EXCEEDANCES,
    flowsByWindow: { 5: flows, 10: flows },
  };
}

/**
 * Returns mock map-quantiles for a predictor site when a mock-flood debug flag
 * or a replay scenario is active, or null otherwise (nothing active, or the site
 * isn't modeled). The replay engine takes precedence when it has data for the site.
 */
export function getMockMapQuantiles(noaaSiteId: string): MapQuantiles | null {
  if (mockReplayEngine.isActive()) {
    const replay = mockReplayEngine.buildMapQuantiles(noaaSiteId);
    if (replay) {
      return replay;
    }
  }
  for (const { flag, peaksBySite } of SCENARIOS) {
    if (getDebugFlag(flag)) {
      const peak = peaksBySite[noaaSiteId];
      return peak ? toMapQuantiles(peak) : null;
    }
  }
  return null;
}
