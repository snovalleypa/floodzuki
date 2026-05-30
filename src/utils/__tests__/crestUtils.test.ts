import { buildCrestTimestampSet, type PeakLike } from "../crestUtils";

describe("buildCrestTimestampSet", () => {
  it("returns an empty set when peaks is null or undefined", () => {
    expect(buildCrestTimestampSet(null).size).toBe(0);
    expect(buildCrestTimestampSet(undefined).size).toBe(0);
  });

  it("returns an empty set when peaks is an empty array", () => {
    expect(buildCrestTimestampSet([]).size).toBe(0);
  });

  it("collects every peak timestampMs into the set", () => {
    const peaks = [{ timestampMs: 1000 }, { timestampMs: 2000 }, { timestampMs: 3000 }];
    const set = buildCrestTimestampSet(peaks);
    expect(set.size).toBe(3);
    expect(set.has(1000)).toBe(true);
    expect(set.has(2000)).toBe(true);
    expect(set.has(3000)).toBe(true);
  });

  it("skips peaks without a numeric timestampMs", () => {
    const peaks: PeakLike[] = [
      { timestampMs: 1000 },
      { timestampMs: undefined },
      { timestampMs: null },
      {},
      { timestampMs: 2000 },
    ];
    const set = buildCrestTimestampSet(peaks);
    expect(set.size).toBe(2);
    expect(set.has(1000)).toBe(true);
    expect(set.has(2000)).toBe(true);
  });
});
