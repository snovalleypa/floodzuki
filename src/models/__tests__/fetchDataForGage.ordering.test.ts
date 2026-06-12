import { GageStoreModel } from "../Gage";
import { api } from "@services/api";

// The store keeps `readings` newest-first (descending). The chart relies on this:
// useGageChartOptions reverses the array before plotting, and Gage.predictedPoints
// uses readings[0] as the latest reading. The live-polling append must preserve it.
jest.mock("@services/api", () => ({
  api: { getGageReadings: jest.fn() },
}));

const buildStore = () =>
  GageStoreModel.create({
    gages: [
      {
        locationId: "USGS-38",
        lastReadingId: 100,
        readings: [
          { id: 100, timestamp: "2026-06-10T12:00:00", waterHeight: 5 },
          { id: 99, timestamp: "2026-06-10T11:00:00", waterHeight: 4 },
          { id: 98, timestamp: "2026-06-10T10:00:00", waterHeight: 3 },
        ],
      } as any,
    ],
  });

describe("GageStore.fetchDataForGage — live append ordering", () => {
  afterEach(() => jest.clearAllMocks());

  it("keeps readings newest-first after an incremental live append", async () => {
    const store = buildStore();

    (api.getGageReadings as jest.Mock).mockResolvedValue({
      kind: "ok",
      data: {
        lastReadingId: 102,
        readings: [
          { id: 102, timestamp: "2026-06-10T14:00:00", waterHeight: 7 },
          { id: 101, timestamp: "2026-06-10T13:00:00", waterHeight: 6 },
        ],
        predictions: [],
      },
    });

    // includeLastReading=true → the incremental append branch the live poll uses.
    await store.fetchDataForGage("USGS-38", undefined, undefined, true, true);

    const ids = store.gages[0].readings.map((r) => r.id);
    // The just-fetched newest reading (102) must be at the front, not appended to
    // the end where it would create a spurious chart segment back to the oldest point.
    expect(ids).toEqual([102, 101, 100, 99, 98]);
  });

  it("does not duplicate a reading if the API resends one at the boundary", async () => {
    const store = buildStore();

    (api.getGageReadings as jest.Mock).mockResolvedValue({
      kind: "ok",
      data: {
        lastReadingId: 101,
        readings: [
          { id: 101, timestamp: "2026-06-10T13:00:00", waterHeight: 6 },
          { id: 100, timestamp: "2026-06-10T12:00:00", waterHeight: 5 },
        ],
        predictions: [],
      },
    });

    await store.fetchDataForGage("USGS-38", undefined, undefined, true, true);

    const ids = store.gages[0].readings.map((r) => r.id);
    expect(ids).toEqual([101, 100, 99, 98]);
  });
});
