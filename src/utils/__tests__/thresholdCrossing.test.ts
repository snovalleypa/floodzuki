import localDayJs from "@services/localDayJs";
import { computeThresholdCrossing } from "@utils/thresholdCrossing";

const TZ = "America/Los_Angeles";
const ROAD = 60;
const RED = 56;

// Predictions rising/falling linearly at `stepFt` per 15-min step from `start`.
function predictions(start: number, stepFt: number, count: number) {
  const base = localDayJs.tz("2026-06-12T00:00:00", "YYYY-MM-DDTHH:mm:ss", TZ);
  return Array.from({ length: count }, (_, i) => ({
    timestamp: base.add(i * 15, "minute").format("YYYY-MM-DDTHH:mm:ss"),
    waterHeight: start + i * stepFt,
  }));
}

const at = (s: string) => localDayJs.tz(s, "YYYY-MM-DDTHH:mm:ss", TZ).valueOf();

describe("computeThresholdCrossing", () => {
  it("returns null with no threshold (no road, no red stage)", () => {
    const gage: any = {
      roadSaddleHeight: undefined,
      roadDisplayName: undefined,
      redStage: undefined,
      predictions: predictions(58, 1, 5),
    };
    expect(computeThresholdCrossing(gage, TZ)).toBeNull();
  });

  it("returns null when there are no predictions", () => {
    const gage: any = {
      roadSaddleHeight: ROAD,
      roadDisplayName: "Rd",
      redStage: RED,
      predictions: [],
    };
    expect(computeThresholdCrossing(gage, TZ)).toBeNull();
  });

  it("uses the road saddle when the gauge has a road", () => {
    // 58,59,60 → hits ROAD (60) at index 2 (+30 min).
    const gage: any = {
      roadSaddleHeight: ROAD,
      roadDisplayName: "NE Test Road",
      redStage: RED,
      predictions: predictions(58, 1, 6),
    };
    const crossing = computeThresholdCrossing(gage, TZ);
    expect(crossing).not.toBeNull();
    expect(crossing!.kind).toBe("road");
    expect(crossing!.time.valueOf()).toBe(at("2026-06-12T00:30:00"));
  });

  it("falls back to the flood (red) stage when there is no road", () => {
    // 54,55,56 → hits RED (56) at index 2 (+30 min).
    const gage: any = {
      roadSaddleHeight: undefined,
      roadDisplayName: undefined,
      redStage: RED,
      predictions: predictions(54, 1, 6),
    };
    const crossing = computeThresholdCrossing(gage, TZ);
    expect(crossing).not.toBeNull();
    expect(crossing!.kind).toBe("flood");
    expect(crossing!.time.valueOf()).toBe(at("2026-06-12T00:30:00"));
  });

  it("interpolates a fractional crossing between points", () => {
    // 59.5 → 60.5 crosses ROAD (60) at the midpoint (+7.5 min).
    const gage: any = {
      roadSaddleHeight: ROAD,
      roadDisplayName: "Rd",
      redStage: RED,
      predictions: predictions(59.5, 1, 3),
    };
    const crossing = computeThresholdCrossing(gage, TZ);
    expect(crossing!.time.valueOf()).toBe(at("2026-06-12T00:07:30"));
  });

  it("handles a falling trend crossing downward", () => {
    const gage: any = {
      roadSaddleHeight: ROAD,
      roadDisplayName: "Rd",
      redStage: RED,
      predictions: predictions(62, -1, 5),
    };
    const crossing = computeThresholdCrossing(gage, TZ);
    expect(crossing!.time.valueOf()).toBe(at("2026-06-12T00:30:00"));
  });

  it("returns null when the trend never reaches the threshold", () => {
    const gage: any = {
      roadSaddleHeight: ROAD,
      roadDisplayName: "Rd",
      redStage: RED,
      predictions: predictions(50, 1, 5), // 50..54, never reaches 60
    };
    expect(computeThresholdCrossing(gage, TZ)).toBeNull();
  });
});
