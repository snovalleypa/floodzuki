import localDayJs from "@services/localDayJs";
import { computeRoadCrossing } from "@utils/roadCrossing";

const TZ = "America/Los_Angeles";
const ROAD = 60;

// Build predictions rising linearly from `start` ft at 1 ft per 15-min step.
function risingPredictions(start: number, stepFt: number, count: number) {
  const base = localDayJs.tz("2026-06-12T00:00:00", "YYYY-MM-DDTHH:mm:ss", TZ);
  return Array.from({ length: count }, (_, i) => ({
    timestamp: base.add(i * 15, "minute").format("YYYY-MM-DDTHH:mm:ss"),
    waterHeight: start + i * stepFt,
  }));
}

describe("computeRoadCrossing", () => {
  it("returns null when the gauge has no road", () => {
    const gage: any = { roadSaddleHeight: undefined, predictions: risingPredictions(58, 1, 5) };
    expect(computeRoadCrossing(gage, TZ)).toBeNull();
  });

  it("returns null when there are no predictions", () => {
    const gage: any = { roadSaddleHeight: ROAD, predictions: [] };
    expect(computeRoadCrossing(gage, TZ)).toBeNull();
  });

  it("returns null when the trend never reaches the road in the window", () => {
    // 50 → 54 over 5 steps, road is 60 → never crossed.
    const gage: any = { roadSaddleHeight: ROAD, predictions: risingPredictions(50, 1, 5) };
    expect(computeRoadCrossing(gage, TZ)).toBeNull();
  });

  it("interpolates the crossing time between two prediction points", () => {
    // 58, 59, 60... — exact hit at the 3rd point (index 2 → +30 min).
    const gage: any = { roadSaddleHeight: ROAD, predictions: risingPredictions(58, 1, 6) };
    const crossing = computeRoadCrossing(gage, TZ);
    const expected = localDayJs.tz("2026-06-12T00:30:00", "YYYY-MM-DDTHH:mm:ss", TZ);
    expect(crossing).not.toBeNull();
    expect(crossing!.valueOf()).toBe(expected.valueOf());
  });

  it("interpolates a fractional crossing between points", () => {
    // 59.5 → 60.5 across one 15-min step crosses road (60) at the midpoint (+7.5 min).
    const gage: any = { roadSaddleHeight: ROAD, predictions: risingPredictions(59.5, 1, 3) };
    const crossing = computeRoadCrossing(gage, TZ);
    const expected = localDayJs.tz("2026-06-12T00:07:30", "YYYY-MM-DDTHH:mm:ss", TZ);
    expect(crossing!.valueOf()).toBe(expected.valueOf());
  });

  it("handles a falling trend crossing the road downward", () => {
    const gage: any = { roadSaddleHeight: ROAD, predictions: risingPredictions(62, -1, 5) };
    const crossing = computeRoadCrossing(gage, TZ);
    const expected = localDayJs.tz("2026-06-12T00:30:00", "YYYY-MM-DDTHH:mm:ss", TZ);
    expect(crossing!.valueOf()).toBe(expected.valueOf());
  });
});
