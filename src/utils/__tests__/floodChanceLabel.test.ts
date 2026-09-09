import { formatFloodChanceLabel } from "../floodChanceLabel";

// Stub `t`: echoes the key, and appends serialized options when present so we can
// assert interpolation without depending on the real i18n strings.
const t = ((key: string, opts?: Record<string, unknown>) =>
  opts ? `${key}:${JSON.stringify(opts)}` : key) as any;

describe("formatFloodChanceLabel", () => {
  it("low → the low key", () => {
    expect(formatFloodChanceLabel({ level: "low" }, t)).toBe("calloutReading.floodChanceLow");
  });

  it("percent → NN%", () => {
    expect(formatFloodChanceLabel({ level: "percent", percent: 45 }, t)).toBe("45%");
  });

  it("veryHighClamp → the >90% key", () => {
    expect(formatFloodChanceLabel({ level: "veryHighClamp" }, t)).toBe(
      "calloutReading.floodChanceVeryHigh"
    );
  });

  it("veryHigh → the exact-percent key with interpolation", () => {
    expect(formatFloodChanceLabel({ level: "veryHigh", percent: 95 }, t)).toBe(
      'calloutReading.floodChanceVeryHighExact:{"percent":95}'
    );
  });

  it("nearCertain → the >=99% key", () => {
    expect(formatFloodChanceLabel({ level: "nearCertain" }, t)).toBe(
      "calloutReading.floodChanceNearCertain"
    );
  });
});
