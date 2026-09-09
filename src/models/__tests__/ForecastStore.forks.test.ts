import { ForecastStoreModel } from "../Forecasts";
import { RootStoreModel } from "../RootStore";
import { api } from "@services/api";
import { getForecastFetchIds } from "@utils/forecastGroups";
import { ChartColorsHex } from "@common-ui/constants/colors";
import { ForecastSeverity } from "../helpers/regionSummary";

jest.mock("@services/api", () => ({
  api: { getReadings: jest.fn(), getForecasts: jest.fn() },
}));

const METAGAGE = "USGS-SF17/USGS-NF10/USGS-MF11";

describe("ForecastStore — fork fetching, colors, severity", () => {
  afterEach(() => jest.clearAllMocks());

  it("requests the metagage's component forks in addition to the top-level ids", async () => {
    const store = ForecastStoreModel.create({ forecasts: {} });
    (api.getReadings as jest.Mock).mockResolvedValue({
      kind: "ok",
      data: { readings: {}, maxReadingId: null },
    });

    await store.fetchRecentReadings();

    const sentIds = (api.getReadings as jest.Mock).mock.calls[0][0].gageIds.split(",");
    expect(sentIds).toEqual(getForecastFetchIds());
    expect(sentIds).toContain("USGS-SF17");
    expect(sentIds).toContain("USGS-MF11");
    expect(sentIds).toContain("USGS-NF10");
  });

  it("assigns each forecast its deterministic color regardless of response order", async () => {
    const store = ForecastStoreModel.create({ forecasts: {} });
    const reading = { timestamps: [], waterHeights: [], discharges: [] };
    (api.getReadings as jest.Mock).mockResolvedValue({
      kind: "ok",
      data: {
        readings: {
          "USGS-NF10": reading,
          [METAGAGE]: reading,
          "USGS-22": reading,
        },
        maxReadingId: null,
      },
    });

    await store.fetchRecentReadings();

    expect(store.forecasts.get(METAGAGE)?.color).toBe(ChartColorsHex[0]);
    expect(store.forecasts.get("USGS-22")?.color).toBe(ChartColorsHex[2]);
    expect(store.forecasts.get("USGS-NF10")?.color).not.toBe(ChartColorsHex[0]);
  });

  it("computes severity only from top-level FORECAST_GAGE_IDS, ignoring forks", () => {
    // Build a full RootStore so the `locationInfo` safeReference on each ForecastModel
    // can resolve — without a containing tree the reference always stays undefined and
    // dischargeStageTwo is never set, making the test trivially pass with or without
    // the filter.
    //
    // USGS-SF17 is a FORK component (not in FORECAST_GAGE_IDS).  Its locationInfo has
    // dischargeStageTwo=10000, and its predicted peak discharge is 99999, which would
    // produce ForecastSeverity.Flood if the fork were included in the severity calc.
    //
    // USGS-38 is a TOP-LEVEL id (in FORECAST_GAGE_IDS).  Its locationInfo has
    // dischargeStageOne=5000 and its predicted peak discharge is 6000, which is above
    // stageOne but below stageTwo → ForecastSeverity.Near.
    //
    // With the filter in place:   severity === "near"  (only USGS-38 contributes)
    // Without the filter:         severity === "flood" (USGS-SF17 pushes it to Flood)
    const root = RootStoreModel.create({
      locationInfoStore: {
        locationInfos: [
          // Fork — NOT in FORECAST_GAGE_IDS; high flood stage
          { id: "USGS-SF17", dischargeStageOne: 8000, dischargeStageTwo: 10000 },
          // Top-level gage — in FORECAST_GAGE_IDS
          { id: "USGS-38", dischargeStageOne: 5000, dischargeStageTwo: 20000 },
        ] as any,
      },
      forecastsStore: {
        forecasts: {
          // Fork: peak well above its stageTwo → would be Flood if included
          "USGS-SF17": {
            id: "USGS-SF17",
            locationInfo: "USGS-SF17",
            predictions: {
              forecastCreated: "2026-06-15T00:00:00",
              discharges: [],
              waterHeights: [],
              timestamps: [],
              peaks: {
                discharges: [99999],
                waterHeights: [0],
                timestamps: ["2026-06-15T06:00:00"],
              },
            },
          },
          // Top-level: peak above stageOne but below stageTwo → Near
          "USGS-38": {
            id: "USGS-38",
            locationInfo: "USGS-38",
            predictions: {
              forecastCreated: "2026-06-15T00:00:00",
              discharges: [],
              waterHeights: [],
              timestamps: [],
              peaks: {
                discharges: [6000],
                waterHeights: [0],
                timestamps: ["2026-06-15T06:00:00"],
              },
            },
          },
        },
      },
    } as any);

    const store = root.forecastsStore;

    // Verify that the safeReferences actually resolved — if they didn't resolve the
    // test would be vacuous (dischargeStageTwo undefined → always None).
    expect(store.forecasts.get("USGS-SF17")?.dischargeStageTwo).toBe(10000);
    expect(store.forecasts.get("USGS-38")?.dischargeStageOne).toBe(5000);

    // With the filter in place: only USGS-38 (top-level) contributes → Near, not Flood.
    expect(store.severity).toBe(ForecastSeverity.Near);
    // The fork's would-be Flood severity must NOT bubble up.
    expect(store.severity).not.toBe(ForecastSeverity.Flood);
  });
});
