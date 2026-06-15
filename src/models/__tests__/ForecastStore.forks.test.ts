import { ForecastStoreModel } from "../Forecasts";
import { api } from "@services/api";
import { getForecastFetchIds } from "@utils/forecastGroups";

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

    expect(store.forecasts.get(METAGAGE)?.color).toBe("#0000FF");
    expect(store.forecasts.get("USGS-22")?.color).toBe("#800000");
    expect(store.forecasts.get("USGS-NF10")?.color).not.toBe("#0000FF");
  });

  it("computes severity only from top-level FORECAST_GAGE_IDS, ignoring forks", async () => {
    const store = ForecastStoreModel.create({
      forecasts: {
        "USGS-SF17": {
          id: "USGS-SF17",
          predictions: {
            forecastCreated: "2026-06-15T00:00:00",
            discharges: [],
            waterHeights: [],
            timestamps: [],
            peaks: { discharges: [99999], waterHeights: [0], timestamps: ["2026-06-15T06:00:00"] },
          },
        } as any,
      },
    });

    expect(store.severity).toBe("none");
  });
});
