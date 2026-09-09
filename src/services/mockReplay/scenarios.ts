// src/services/mockReplay/scenarios.ts
import localDayJs from "@services/localDayJs";
import { MockReplayScenario } from "./types";

/** Strict format an ad-hoc mock datetime must match, e.g. 2022-03-01T06:00:00. */
const MOCK_NOW_FORMAT = "YYYY-MM-DDTHH:mm:ss";

/**
 * Forecast knobs applied to an ad-hoc scenario when the mock URL param is just a
 * datetime (no named scenario). The "default scenario" the datetime is dropped
 * into: forecast issued 4h after mockNow (age -4), no deviation from actual.
 */
export const DEFAULT_AD_HOC_SCENARIO: Pick<
  MockReplayScenario,
  "forecastAgeHours" | "forecastDeviationPct"
> = {
  forecastAgeHours: -4,
  forecastDeviationPct: 0,
};

export const MOCK_REPLAY_SCENARIOS: MockReplayScenario[] = [
  {
    id: "march-2022-major",
    label: "March 2022 — major flood",
    mockNow: "2022-03-01T06:00:00",
    forecastAgeHours: 10,
    forecastDeviationPct: 0,
  },
  {
    id: "jan-2022-moderate",
    label: "Jan 21 2022 — moderate flood",
    mockNow: "2022-01-20T18:00:00",
    forecastAgeHours: 6,
    forecastDeviationPct: -15,
  },
  {
    id: "march-2022-overforecast",
    label: "March 2022 — forecast runs 15% high",
    mockNow: "2022-02-27T12:00:00",
    forecastAgeHours: -4,
    forecastDeviationPct: 15,
  },
  {
    id: "march-2022-underforecast",
    label: "March 2022 — forecast runs 25% low",
    mockNow: "2022-02-29T18:50:00",
    forecastAgeHours: -4,
    forecastDeviationPct: -25,
  },
];

export function getScenarioById(id: string): MockReplayScenario | undefined {
  return MOCK_REPLAY_SCENARIOS.find((s) => s.id === id);
}

/**
 * Turn a full-ISO datetime token (YYYY-MM-DDTHH:mm:ss, gauge tz) into an ad-hoc
 * scenario anchored at that moment, using the default forecast knobs. Returns
 * undefined for anything that isn't a strict, valid datetime of that exact shape.
 */
function adHocScenarioFromDateTime(token: string): MockReplayScenario | undefined {
  if (!localDayJs(token, MOCK_NOW_FORMAT, true).isValid()) {
    return undefined;
  }
  return {
    id: token,
    label: `Custom — ${token}`,
    mockNow: token,
    ...DEFAULT_AD_HOC_SCENARIO,
  };
}

/**
 * Resolve a mock token into a scenario: either a named scenario id, or a full-ISO
 * datetime that becomes an ad-hoc scenario (default forecast age/deviation).
 * Returns undefined when the token is neither.
 */
export function resolveScenario(token: string): MockReplayScenario | undefined {
  return getScenarioById(token) ?? adHocScenarioFromDateTime(token);
}
