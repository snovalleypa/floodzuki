import { selectCardMembership } from "../floodCardMembership";

// Minimal duck-typed gauge: only the fields the helper reads. "SVPA-36" and
// "USGS-38"/"USGS-22" are real covered ids; "USGS-99" is not covered.
const g = (over: Partial<any>) =>
  ({
    locationId: "SVPA-36",
    hasRoads: false,
    roadSaddleHeight: undefined,
    redStage: 74.12,
    ...over,
  } as any);

describe("selectCardMembership", () => {
  it("no-road covered gauge → flood card only", () => {
    const gage = g({ locationId: "USGS-38", hasRoads: false, redStage: 60 });
    const { roadRows, floodRows } = selectCardMembership([gage]);
    expect(roadRows).toHaveLength(0);
    expect(floodRows).toEqual([gage]);
  });

  it("type-1 (red == saddle) → road card only", () => {
    const gage = g({ hasRoads: true, roadSaddleHeight: 74.12, redStage: 74.12 });
    const { roadRows, floodRows } = selectCardMembership([gage]);
    expect(roadRows).toEqual([gage]);
    expect(floodRows).toHaveLength(0);
  });

  it("type-2 (red != saddle) → both cards", () => {
    const gage = g({ hasRoads: true, roadSaddleHeight: 76.55, redStage: 74.12 });
    const { roadRows, floodRows } = selectCardMembership([gage]);
    expect(roadRows).toEqual([gage]);
    expect(floodRows).toEqual([gage]);
  });

  it("uncovered gauge → neither card", () => {
    const gage = g({ locationId: "USGS-99", hasRoads: true, roadSaddleHeight: 80, redStage: 70 });
    const { roadRows, floodRows } = selectCardMembership([gage]);
    expect(roadRows).toHaveLength(0);
    expect(floodRows).toHaveLength(0);
  });

  it("preserves input order", () => {
    const a = g({ locationId: "USGS-38", hasRoads: false, redStage: 60 });
    const b = g({ locationId: "USGS-22", hasRoads: false, redStage: 50 });
    const { floodRows } = selectCardMembership([a, b]);
    expect(floodRows.map((x) => x.locationId)).toEqual(["USGS-38", "USGS-22"]);
  });
});
