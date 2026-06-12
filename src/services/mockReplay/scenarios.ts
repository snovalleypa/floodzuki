// src/services/mockReplay/scenarios.ts
import { MockReplayScenario } from "./types";

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
    mockNow: "2022-02-28T20:00:00",
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
