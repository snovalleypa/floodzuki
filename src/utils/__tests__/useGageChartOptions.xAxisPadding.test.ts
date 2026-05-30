import localDayJs from "@services/localDayJs";
import type { Dayjs } from "dayjs";
import { CHART_OPTIONS } from "../useGageChartOptions";

const t = (key: string) => key;
const PREDICTION_WINDOW_MINUTES = 60 * 6;

type GageDetailsOptionsArgs = Parameters<typeof CHART_OPTIONS.gageDetailsOptions>;
type TestOptions = GageDetailsOptionsArgs[0] & {
  _now: Dayjs;
  xAxis: Highcharts.XAxisOptions;
};
type TestGage = GageDetailsOptionsArgs[1];

function makeRange(isNow: boolean) {
  const end = localDayJs("2024-01-15T10:00:00.000Z");
  return {
    chartStartDate: end.subtract(2, "day"),
    chartEndDate: end,
    isNow,
  };
}

function makeOptions(): TestOptions {
  return { xAxis: {}, _now: localDayJs() };
}

const mockGageWithPredictions = {
  predictedPoints: [{ timestamp: localDayJs(), reading: 5 }],
  dataPoints: [],
} as TestGage;

const mockGageNoPredictions = {
  predictedPoints: undefined,
  dataPoints: [],
} as TestGage;

describe("gageDetailsOptions — x-axis prediction window padding", () => {
  it("extends xAxis.max by 6 hours when isNow=true and predictedPoints exist", () => {
    const range = makeRange(true);
    const [result] = CHART_OPTIONS.gageDetailsOptions(
      makeOptions(),
      mockGageWithPredictions,
      range,
      t
    );
    const xAxis = result.xAxis as Highcharts.XAxisOptions;
    expect(xAxis.max).toBe(range.chartEndDate.add(PREDICTION_WINDOW_MINUTES, "m").valueOf());
  });

  it("does not extend xAxis.max when isNow=false, even with predictedPoints", () => {
    const range = makeRange(false);
    const [result] = CHART_OPTIONS.gageDetailsOptions(
      makeOptions(),
      mockGageWithPredictions,
      range,
      t
    );
    const xAxis = result.xAxis as Highcharts.XAxisOptions;
    expect(xAxis.max).toBe(range.chartEndDate.valueOf());
  });

  it("does not extend xAxis.max when predictedPoints is absent, regardless of isNow", () => {
    const range = makeRange(true);
    const [result] = CHART_OPTIONS.gageDetailsOptions(
      makeOptions(),
      mockGageNoPredictions,
      range,
      t
    );
    const xAxis = result.xAxis as Highcharts.XAxisOptions;
    expect(xAxis.max).toBe(range.chartEndDate.valueOf());
  });
});
