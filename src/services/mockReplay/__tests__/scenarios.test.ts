// src/services/mockReplay/__tests__/scenarios.test.ts
import { MOCK_REPLAY_SCENARIOS, getScenarioById } from "../scenarios";

describe("scenarios", () => {
  it("exposes at least one scenario with the required fields", () => {
    expect(MOCK_REPLAY_SCENARIOS.length).toBeGreaterThan(0);
    for (const s of MOCK_REPLAY_SCENARIOS) {
      expect(typeof s.id).toBe("string");
      expect(s.mockNow).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
      expect(typeof s.forecastAgeHours).toBe("number");
      expect(typeof s.forecastDeviationPct).toBe("number");
    }
  });

  it("has unique ids", () => {
    const ids = MOCK_REPLAY_SCENARIOS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("looks scenarios up by id", () => {
    const first = MOCK_REPLAY_SCENARIOS[0];
    expect(getScenarioById(first.id)).toEqual(first);
    expect(getScenarioById("nope")).toBeUndefined();
  });
});
