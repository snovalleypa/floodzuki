// src/services/mockReplay/scenarios.ts
import { MockReplayScenario } from "./types";

export const MOCK_REPLAY_SCENARIOS: MockReplayScenario[] = [
  {
    id: "march-2022-major",
    label: "March 2022 — major flood",
    mockNow: "2022-03-01T06:00:00",
    forecastAgeHours: 18,
    forecastDeviationPct: 0,
  },
  {
    id: "jan-2022-moderate",
    label: "Jan 21 2022 — moderate flood",
    mockNow: "2022-01-21T06:00:00",
    forecastAgeHours: 18,
    forecastDeviationPct: 0,
  },
  {
    id: "march-2022-overforecast",
    label: "March 2022 — forecast runs 15% hot",
    mockNow: "2022-03-01T06:00:00",
    forecastAgeHours: 18,
    forecastDeviationPct: 15,
  },
];

export function getScenarioById(id: string): MockReplayScenario | undefined {
  return MOCK_REPLAY_SCENARIOS.find((s) => s.id === id);
}
