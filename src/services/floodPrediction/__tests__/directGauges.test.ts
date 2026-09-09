import { DIRECT_GAUGES, getDirectGaugeConstants } from "../directGauges";

describe("directGauges registry", () => {
  it("lists each covered gauge with the required site fields", () => {
    expect(DIRECT_GAUGES.length).toBeGreaterThan(0);
    for (const g of DIRECT_GAUGES) {
      expect(g.gaugeId).toMatch(/^USGS-/);
      expect(g.usgsSiteId).toMatch(/^\d+$/);
      expect(g.noaaSiteId).toMatch(/^[A-Z0-9]+$/);
      expect(typeof g.name).toBe("string");
    }
  });

  it("has unique gauge ids and unique NOAA sites", () => {
    const ids = DIRECT_GAUGES.map((g) => g.gaugeId);
    const noaa = DIRECT_GAUGES.map((g) => g.noaaSiteId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(noaa).size).toBe(noaa.length);
  });

  it("covers the verified HEFS gauges and excludes Duvall / the metagage", () => {
    const ids = DIRECT_GAUGES.map((g) => g.gaugeId);
    expect(ids).toEqual(
      expect.arrayContaining([
        "USGS-38",
        "USGS-22",
        "USGS-SH5",
        "USGS-SF17",
        "USGS-MF11",
        "USGS-NF10",
      ])
    );
    expect(ids).not.toContain("USGS-9");
    expect(ids).not.toContain("USGS-SF17/USGS-NF10/USGS-MF11");
  });

  it("resolves by locationId, miss returns null", () => {
    expect(getDirectGaugeConstants("USGS-22")?.noaaSiteId).toBe("CRNW1");
    expect(getDirectGaugeConstants("SVPA-25")).toBeNull();
    expect(getDirectGaugeConstants(undefined)).toBeNull();
  });
});
