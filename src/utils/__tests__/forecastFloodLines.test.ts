import { computeFloodLines } from "../useForecastOptions";

const t = (k: string, opts?: any) => (k === "forecastChart.floodStage" ? "Flood Stage" : k);

const mkForecast = (id: string, noaaSiteId: string, stageTwo: number) =>
  ({ id, noaaSiteId, dischargeStageTwo: stageTwo } as any);

describe("computeFloodLines", () => {
  it("draws only the Falls line for the default combined forecast", () => {
    const lines = computeFloodLines(
      [
        mkForecast("USGS-SF17/USGS-NF10/USGS-MF11", "", 12000),
        mkForecast("USGS-38", "SQUW1", 19400),
        mkForecast("USGS-22", "CRNW1", 16500),
      ],
      undefined,
      t
    );
    expect(lines).toHaveLength(1);
    expect(lines[0].value).toBe(19400);
    expect(lines[0].label.text).toContain("Falls/Carnation");
  });

  it("draws the metagage line when overridden to the metagage id", () => {
    const lines = computeFloodLines(
      [
        mkForecast("USGS-SF17/USGS-NF10/USGS-MF11", "", 12000),
        mkForecast("USGS-SF17", "GARW1", 5000),
        mkForecast("USGS-MF11", "TANW1", 6000),
        mkForecast("USGS-NF10", "SNQW1", 7000),
      ],
      { gageId: "USGS-SF17/USGS-NF10/USGS-MF11", label: "Forks" },
      t
    );
    expect(lines).toHaveLength(1);
    expect(lines[0].value).toBe(12000);
    expect(lines[0].label.text).toContain("Forks");
  });

  it("draws the single gage's line for a one-gage chart", () => {
    const lines = computeFloodLines([mkForecast("USGS-38", "SQUW1", 19400)], undefined, t);
    expect(lines).toHaveLength(1);
    expect(lines[0].value).toBe(19400);
  });
});
