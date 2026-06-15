import { getForecastFetchIds, findForecastGroup, buildForecastColorMap } from "../forecastGroups";
import Config from "@config/config";
import { ChartColorsHex } from "@common-ui/constants/colors";
import { ROUTES } from "app/_layout";

// app/_layout pulls in native bottom-sheet/reanimated modules that don't run in Jest.
jest.mock("app/_layout", () => ({
  ROUTES: {
    Forecast: "/forecast",
    ForecastDetails: "/forecast/[...id]",
  },
}));

const METAGAGE = "USGS-SF17/USGS-NF10/USGS-MF11";

describe("getForecastFetchIds", () => {
  it("appends fork components (S->M->N) after the top-level display ids", () => {
    expect(getForecastFetchIds()).toEqual([
      METAGAGE,
      "USGS-38",
      "USGS-22",
      "USGS-SF17",
      "USGS-MF11",
      "USGS-NF10",
    ]);
  });

  it("does not contain duplicates", () => {
    const ids = getForecastFetchIds();
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("findForecastGroup", () => {
  it("resolves a top-level id to the top-level group with a Forecast back route", () => {
    const group = findForecastGroup("USGS-38");
    expect(group?.ids).toEqual(Config.FORECAST_GAGE_IDS);
    expect(group?.backRoute).toEqual({ pathname: ROUTES.Forecast, params: undefined });
  });

  it("resolves the metagage id to the top-level group", () => {
    expect(findForecastGroup(METAGAGE)?.ids).toEqual(Config.FORECAST_GAGE_IDS);
  });

  it("resolves a fork id to the S->M->N fork group with a back route to its metagage", () => {
    const group = findForecastGroup("USGS-NF10");
    expect(group?.ids).toEqual(["USGS-SF17", "USGS-MF11", "USGS-NF10"]);
    expect(group?.backRoute).toEqual({
      pathname: ROUTES.ForecastDetails,
      params: { id: METAGAGE.split("/") },
    });
  });

  it("returns null for an unknown id", () => {
    expect(findForecastGroup("USGS-999")).toBeNull();
  });
});

describe("buildForecastColorMap", () => {
  it("keeps top-level colors stable and gives every fork a distinct color", () => {
    const map = buildForecastColorMap();
    expect(map[METAGAGE]).toBe(ChartColorsHex[0]); // #0000FF
    expect(map["USGS-38"]).toBe(ChartColorsHex[1]); // #008000
    expect(map["USGS-22"]).toBe(ChartColorsHex[2]); // #800000
    const forkColors = ["USGS-SF17", "USGS-MF11", "USGS-NF10"].map((id) => map[id]);
    expect(new Set(forkColors).size).toBe(3);
    expect(forkColors).not.toContain(map[METAGAGE]);
  });
});
