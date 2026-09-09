import { isAtOrAboveRedStage, isAtOrAboveThreshold } from "../useFloodRiskLevel";

describe("isAtOrAboveThreshold", () => {
  it("is true when height >= threshold", () => {
    expect(isAtOrAboveThreshold(76.6, 76.55)).toBe(true);
    expect(isAtOrAboveThreshold(76.55, 76.55)).toBe(true);
  });

  it("is false when height < threshold", () => {
    expect(isAtOrAboveThreshold(70, 76.55)).toBe(false);
  });

  it("is false for nullish inputs", () => {
    expect(isAtOrAboveThreshold(undefined, 76.55)).toBe(false);
    expect(isAtOrAboveThreshold(null, 76.55)).toBe(false);
    expect(isAtOrAboveThreshold(76.6, null)).toBe(false);
    expect(isAtOrAboveThreshold(76.6, undefined)).toBe(false);
  });
});

describe("isAtOrAboveRedStage", () => {
  it("delegates to isAtOrAboveThreshold", () => {
    expect(isAtOrAboveRedStage(75, 74.12)).toBe(true);
    expect(isAtOrAboveRedStage(70, 74.12)).toBe(false);
    expect(isAtOrAboveRedStage(75, undefined)).toBe(false);
  });
});
