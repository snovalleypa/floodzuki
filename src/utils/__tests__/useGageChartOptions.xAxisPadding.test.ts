import localDayJs from "@services/localDayJs";
import { CHART_OPTIONS } from "../useGageChartOptions";

const t = (key: string) => key;
const PREDICTION_WINDOW_MINUTES = 60 * 6;

function makeRange(isNow: boolean) {
  const end = localDayJs("2024-01-15T10:00:00.000Z");
  return {
    chartStartDate: end.subtract(2, "day"),
    chartEndDate: end,
    isNow,
  };
}

function makeOptions() {
  return { xAxis: {}, _now: localDayJs() } as any;
}

const mockGageWithPredictions: any = {
  predictedPoints: [{ timestamp: localDayJs(), reading: 5 }],
  dataPoints: [],
};

const mockGageNoPredictions: any = {
  predictedPoints: undefined,
  dataPoints: [],
};

describe("gageDetailsOptions — x-axis prediction window padding", () => {
  it("extends xAxis.max by 6 hours when isNow=true and predictedPoints exist", () => {
    const range = makeRange(true);
    const [result] = CHART_OPTIONS.gageDetailsOptions(
      makeOptions(),
      mockGageWithPredictions,
      range,
      t
    );
    const xAxis = result.xAxis as any;
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
    const xAxis = result.xAxis as any;
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
    const xAxis = result.xAxis as any;
    expect(xAxis.max).toBe(range.chartEndDate.valueOf());
  });
});
