// src/services/mockReplay/__tests__/scenarios.test.ts
import {
  MOCK_REPLAY_SCENARIOS,
  DEFAULT_AD_HOC_SCENARIO,
  getScenarioById,
  resolveScenario,
} from "../scenarios";

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

describe("resolveScenario", () => {
  it("resolves a named scenario id", () => {
    const first = MOCK_REPLAY_SCENARIOS[0];
    expect(resolveScenario(first.id)).toEqual(first);
  });

  it("builds an ad-hoc scenario from a full-ISO datetime with the default knobs", () => {
    const s = resolveScenario("2022-03-01T06:00:00");
    expect(s).toEqual({
      id: "2022-03-01T06:00:00",
      label: expect.any(String),
      mockNow: "2022-03-01T06:00:00",
      forecastAgeHours: DEFAULT_AD_HOC_SCENARIO.forecastAgeHours,
      forecastDeviationPct: DEFAULT_AD_HOC_SCENARIO.forecastDeviationPct,
    });
  });

  it("rejects a partial / date-only datetime (full ISO only)", () => {
    expect(resolveScenario("2022-03-01")).toBeUndefined();
    expect(resolveScenario("2022-03-01T06:00")).toBeUndefined();
  });

  it("rejects a non-datetime, non-scenario token", () => {
    expect(resolveScenario("nope")).toBeUndefined();
    expect(resolveScenario("2022-13-40T99:99:99")).toBeUndefined();
  });
});
