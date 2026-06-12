import { useEffect, useState } from "react";
import dayjs, { Dayjs } from "dayjs";

import { Gage, GageChartDataType } from "@models/Gage";
import { useTimeout } from "./useTimeout";
import { useStores } from "@models/helpers/useStores";

import localDayJs from "@services/localDayJs";
import Config from "@config/config";
import { Colors } from "@common-ui/constants/colors";
import { DataPoint } from "@models/Forecasts";
import { useLocale } from "@common-ui/contexts/LocaleContext";
import { Timing } from "@common-ui/constants/timing";
import { buildGageTooltipHtml } from "./chartTooltipHtml";

declare module "highcharts" {
  interface Options {
    _now?: Dayjs;
  }
  interface Point {
    isPrediction?: boolean;
  }
}

interface Range {
  chartStartDate: dayjs.Dayjs;
  chartEndDate: dayjs.Dayjs;
  isNow?: boolean;
}

interface BuildOptionsProps {
  timezone: string;
  gage: Gage;
  chartDataType: GageChartDataType;
}

const DEBUGGING_TIMESPAN_MARGIN = 0; // 300;
const PREDICTION_WINDOW_MINUTES = 60 * 6; // 6 hours of predictions

export const CHART_OPTIONS = {
  dashboardOptions: (options: Highcharts.Options, gage: Gage, range: Range, t) => {
    const xAxis = options.xAxis as Highcharts.XAxisOptions;
    const yAxis = options.yAxis as Highcharts.YAxisOptions;

    options.chart.height = 182;
    xAxis.labels = { enabled: false };
    xAxis.tickLength = 0;
    yAxis.labels = { enabled: false };
    yAxis.gridLineWidth = 0;
    yAxis.title = null;

    for (const line of yAxis.plotLines || []) {
      if (!line.label) {
        continue;
      }
      line.label.style.fontSize = "11px";
      line.label.align = "center";
      line.label.x = 0;
      // Halve the default vertical gap (Highcharts default is -4) between the
      // label and its line on the gauge list page.
      line.label.y = -2;
    }

    xAxis.max = options._now.valueOf();

    const chartBeginTime = options._now
      .clone()
      .subtract(Config.FRONT_PAGE_CHART_DURATION_NUMBER, Config.FRONT_PAGE_CHART_DURATION_UNIT);

    xAxis.min = chartBeginTime.clone().subtract(20, "m").valueOf();

    xAxis.plotLines.push({
      value: chartBeginTime.valueOf(),
      dashStyle: "Dot",
      color: "#9a9a9a",
      label: {
        text: t("gageChart.dashboardDurationLabel"),
        style: { color: "#9a9a9a" },
        align: "left",
      },
    });

    return [options, null] as const;
  },

  gageDetailsOptions: (options: Highcharts.Options, gage: Gage, range: Range, t) => {
    const xAxis = options.xAxis as Highcharts.XAxisOptions;

    let predictionWindow = 0;

    if (gage?.predictedPoints && range.isNow !== false) {
      predictionWindow = PREDICTION_WINDOW_MINUTES;
    }

    xAxis.max = range.chartEndDate
      .clone()
      .add(predictionWindow, "m")
      .add(DEBUGGING_TIMESPAN_MARGIN, "m")
      .valueOf();

    xAxis.min = range.chartStartDate.clone().subtract(DEBUGGING_TIMESPAN_MARGIN, "m").valueOf();

    const crest = calculateCrest(gage?.dataPoints, {
      startDate: range.chartStartDate,
    });

    if (crest) {
      xAxis.plotLines = xAxis.plotLines || [];
      xAxis.plotLines.push(
        makePlotLine({
          value: crest.timestamp.valueOf(),
          label: `${t("measure.max")} ${crest.reading.toFixed(2)} ${t("measure.ft")}`,
        })
      );
    }

    return [options, crest] as const;
  },
};

function calculateCrest(
  dataPoints: DataPoint[],
  { startDate = localDayJs("1970-01-01"), endDate = localDayJs() } = {}
) {
  const points = dataPoints.filter(
    (point) => point.timestamp >= startDate && point.timestamp <= endDate
  );

  if (points.length < 3) {
    return null;
  }

  const [min, max] = points.reduce(
    (mm, d) => [Math.min(d.reading, mm[0]), Math.max(d.reading, mm[1])],
    [+Infinity, -Infinity]
  );

  // max has to be 1' greater than min
  if (max < min + 1) {
    return null;
  }

  //has to be greater then 1st and last points
  if (max === points[0].reading || max === points[points.length - 1].reading) {
    return null;
  }

  const dur = localDayJs.duration(120, "m").asMilliseconds();

  for (let i = points.length - 2; i > 0; i--) {
    const next = points[i - 1];
    const point = points[i];
    const prev = points[i + 1];

    if (
      point.reading === max &&
      point.timestamp - prev.timestamp < dur &&
      next.timestamp - point.timestamp < dur
    ) {
      return point;
    }
  }

  return null;
}

function makePlotLine({ value, label, color = "#9a9a9a" }): Highcharts.XAxisPlotLinesOptions {
  return {
    value,
    dashStyle: "Dot",
    color,
    label: {
      text: label,
      style: { color },
      align: "right",
      x: -5,
    },
  };
}

function createPredictionSeries(
  dataPoints: DataPoint[],
  t,
  groundHeight: number,
  color: string,
  gage: Gage,
  tz: string
) {
  return {
    animation: false,
    name: "predicted gage height",
    data: dataPoints.map((d) => {
      const x = d.timestamp.valueOf();
      const y = d.reading;
      return {
        x,
        y,
        name: `${t("statusLevelsCard.predicted")} ${t("statusLevelsCard.level")}: `,
        isPrediction: true,
        tooltipHtml: buildGageTooltipHtml({
          gage,
          t,
          tz,
          x,
          waterLevel: d.reading,
          waterDischarge: d.waterDischarge,
          isPrediction: true,
        }),
      };
    }),
    fillOpacity: 0,
    color: color,
    threshold: groundHeight || 0,
    lineWidth: 1,
    states: {
      hover: {
        lineWidth: 1,
      },
    },
  };
}

function createActualDataSeries(
  dataPoints: DataPoint[],
  t,
  groundHeight: number,
  color: string,
  gage: Gage,
  tz: string
) {
  return {
    animation: false,
    name: "actual gage height",
    data: dataPoints.map((d) => {
      const x = d.timestamp.valueOf();
      const y = d.reading;
      return {
        x,
        y,
        ts: d.timestamp,
        name: `${t("statusLevelsCard.water")} ${t("statusLevelsCard.level")}: `,
        isPrediction: false,
        tooltipHtml: buildGageTooltipHtml({
          gage,
          t,
          tz,
          x,
          waterLevel: d.reading,
          waterDischarge: d.waterDischarge,
          isPrediction: false,
        }),
      };
    }),
    fillOpacity: 0,
    color: color,
    threshold: groundHeight || 0,
    lineWidth: 1,
    states: {
      hover: {
        lineWidth: 1,
      },
    },
  };
}

function createForecastDataSeries(
  dataPoints: DataPoint[],
  t,
  groundHeight: number,
  color: string,
  gage: Gage,
  tz: string
) {
  return {
    animation: false,
    name: "forecast gage height",
    data: dataPoints.map((d) => {
      const x = d.timestamp.valueOf();
      const y = d.reading;
      return {
        x,
        y,
        name: `${t("statusLevelsCard.predicted")} ${t("statusLevelsCard.level")}: `,
        isPrediction: true,
        tooltipHtml: buildGageTooltipHtml({
          gage,
          t,
          tz,
          x,
          waterLevel: d.reading,
          waterDischarge: d.waterDischarge,
          isPrediction: true,
        }),
      };
    }),
    fillOpacity: 0,
    color: color,
    threshold: groundHeight || 0,
    lineWidth: 1,
    states: {
      hover: {
        lineWidth: 1,
      },
    },
  };
}

function createSeriesAndReturnMin(
  dataPoints,
  gage,
  t,
  color,
  setIsPrediction,
  chartDataType,
  tz: string,
  hideLine: boolean = false
) {
  let data = null;
  let min = Math.min.apply(
    null,
    dataPoints.map((d) => d.reading)
  );

  if (setIsPrediction) {
    if (chartDataType === GageChartDataType.DISCHARGE) {
      data = dataPoints.map((d) => {
        const x = d.timestamp.valueOf();
        const y = d.waterDischarge;
        return {
          x,
          y,
          name: `${t("statusLevelsCard.water")} ${t("statusLevelsCard.level")}: `,
          ts: d.timestamp?.format(),
          isPrediction: false,
          tooltipHtml: buildGageTooltipHtml({
            gage,
            t,
            tz,
            x,
            waterLevel: d.reading,
            waterDischarge: d.waterDischarge,
            isPrediction: false,
          }),
        };
      });
    } else {
      data = dataPoints.map((d) => {
        const x = d.timestamp.valueOf();
        const y = d.reading;
        return {
          x,
          y,
          name: `${t("statusLevelsCard.water")} ${t("statusLevelsCard.level")}: `,
          ts: d.timestamp?.format(),
          isPrediction: false,
          tooltipHtml: buildGageTooltipHtml({
            gage,
            t,
            tz,
            x,
            waterLevel: d.reading,
            waterDischarge: d.waterDischarge,
            isPrediction: false,
          }),
        };
      });
    }
  } else {
    if (chartDataType === GageChartDataType.DISCHARGE) {
      data = dataPoints.map((d) => {
        const x = d.timestamp.valueOf();
        const y = d.waterDischarge;
        return {
          x,
          y,
          name: `${t("statusLevelsCard.predicted")} ${t("statusLevelsCard.level")}: `,
          tooltipHtml: buildGageTooltipHtml({
            gage,
            t,
            tz,
            x,
            waterLevel: d.reading,
            waterDischarge: d.waterDischarge,
            isPrediction: false,
          }),
        };
      });
    } else {
      data = dataPoints.map((d) => {
        const x = d.timestamp.valueOf();
        const y = d.reading;
        return {
          x,
          y,
          name: `${t("statusLevelsCard.predicted")} ${t("statusLevelsCard.level")}: `,
          tooltipHtml: buildGageTooltipHtml({
            gage,
            t,
            tz,
            x,
            waterLevel: d.reading,
            waterDischarge: d.waterDischarge,
            isPrediction: false,
          }),
        };
      });
    }
  }

  const series = [];

  series.push({
    animation: false,
    name: "gage height",
    data: data,
    color: color,
    fillOpacity: 0.5,
    threshold: gage?.groundHeight,
    lineWidth: hideLine ? 0 : 2,
    gapUnit: "value",
    gapSize: localDayJs.duration(2, "hours").asMilliseconds(),
    states: {
      hover: {
        lineWidth: hideLine ? 0 : 3,
      },
    },
    marker: {
      enabled: true,
      radius: 2,
      states: {
        hover: {
          enabled: true,
        },
      },
    },
  });

  return [series, min];
}

function createDataAndReturnMin(gage: Gage, chartDataType: GageChartDataType, t, tz: string) {
  let hasPredictions = false;
  const chartData = [];

  if (gage?.predictedPoints.length > 0) {
    chartData.push(
      createPredictionSeries(
        gage?.predictedPoints,
        t,
        gage?.groundHeight,
        Colors.gageChartPredictionsLineColor,
        gage,
        tz
      )
    );
    hasPredictions = true;
  }

  if (gage?.actualPoints.length > 0) {
    chartData.push(
      createActualDataSeries(
        gage?.actualPoints,
        t,
        gage?.groundHeight,
        Colors.gageChartActualDataLineColor,
        gage,
        tz
      )
    );
  }

  if (gage?.noaaForecastData.length > 0) {
    chartData.push(
      createForecastDataSeries(
        gage?.noaaForecastData,
        t,
        gage?.groundHeight,
        Colors.gageChartForecastDataLineColor,
        gage,
        tz
      )
    );
  }

  const dataPoints = gage?.dataPoints;

  let min = 0;

  const readings = dataPoints
    .slice()
    .filter((d) => !d.isDeleted)
    .reverse();
  const deletedReadings = dataPoints
    .slice()
    .filter((d) => d.isDeleted)
    .reverse();

  const [readingsSeries, seriesMin] = createSeriesAndReturnMin(
    readings,
    gage,
    t,
    Colors.gageChartColor,
    hasPredictions,
    chartDataType,
    tz
  );
  min = seriesMin;

  chartData.push(...readingsSeries);

  if (deletedReadings.length > 0) {
    const [deletedReadingsSeries, deletedSeriesMin] = createSeriesAndReturnMin(
      deletedReadings,
      gage,
      t,
      Colors.gageChartDeletedLineColor,
      false,
      chartDataType,
      tz,
      true
    );
    chartData.push(...deletedReadingsSeries);
    min = Math.min(seriesMin, deletedSeriesMin);
  }

  return [chartData, min] as const;
}

/**
 * Horizontal threshold line(s) for the chart's y-axis. Gauges with a road
 * show the road saddle line; gauges without one show a red "Flooding" line
 * at the flood (red) stage, styled identically to the road line.
 *
 * The thresholds are water-height values (feet), so on a flow (discharge)
 * chart the label is omitted — the line value has no meaning on a CFS axis.
 */
export function buildThresholdPlotLines(
  gage: Gage,
  t,
  chartDataType: GageChartDataType
): Highcharts.YAxisPlotLinesOptions[] {
  let thresholds: { elevation: number; name: string; color: string }[] = [];

  if (gage?.hasRoads) {
    thresholds = gage.roads.map((road) => ({
      elevation: road.elevation,
      name: road.name,
      color: Colors.primary,
    }));
  } else if (gage?.redStage) {
    thresholds = [
      {
        elevation: gage.redStage,
        name: t("gageChart.flooding"),
        color: Colors.primary,
      },
    ];
  }

  const showLabel = chartDataType !== GageChartDataType.DISCHARGE;

  return thresholds.map((threshold) => ({
    value: threshold.elevation,
    label: showLabel
      ? {
          text: threshold.name,
          style: {
            color: threshold.color,
            fontFamily: "'Open Sans', sans-serif",
            fontSize: "14px",
          },
          align: "right",
          x: -10,
        }
      : undefined,
    color: threshold.color,
    dashStyle: "Dot" as Highcharts.DashStyleValue,
  }));
}

const buildBasicOptions = (props: BuildOptionsProps, t) => {
  const { gage, chartDataType } = props;

  const options: Highcharts.Options = {
    chart: {
      height: 300,
      type: "area",
      spacingLeft: 0,
      spacingRight: 5,
      animation: false,
    },
    title: {
      text: null,
    },
    time: {
      timezone: props.timezone,
    },
    legend: { enabled: false },
    plotOptions: {
      series: {
        animation: { duration: 0 },
        states: {
          inactive: { opacity: 1 },
        },
        turboThreshold: 2000,
      },
      area: { fillOpacity: 0.5, animation: false },
    },
    tooltip: {
      useHTML: true,
    },
    xAxis: {
      type: "datetime",
      ordinal: false,
      dateTimeLabelFormats: {
        second: "%H:%M:%S",
        minute: "%a, %l:%M %p",
        hour: "%a, %l %p",
        day: "%a, %b %e",
        week: "%e. %b",
        month: "%b '%y",
      },
    },
    yAxis: {
      type: chartDataType === GageChartDataType.DISCHARGE ? "logarithmic" : "linear",
      startOnTick: false,
      endOnTick: false,
      title: {
        text:
          chartDataType === GageChartDataType.DISCHARGE
            ? `${t("gageChart.discharge")} (${t("measure.cfs")})`
            : `${t("gageChart.waterLevel")} (${t("measure.ft")}.)`,
      },
    },
  };

  const [series, minVal] = createDataAndReturnMin(gage, chartDataType, t, props.timezone);

  const { yMaximum, yMinimum } = gage?.getChartMinAndMax(chartDataType);

  options.series = series;
  const yAxis = options.yAxis as Highcharts.YAxisOptions;
  const xAxis = options.xAxis as Highcharts.XAxisOptions;
  const yAxisMin = Math.max(gage?.groundHeight || 0, yMinimum);
  yAxis.min = Math.min(minVal, yAxisMin);
  yAxis.max = yMaximum;

  yAxis.plotLines = buildThresholdPlotLines(gage, t, chartDataType);

  options._now = localDayJs();

  xAxis.plotLines = [];
  xAxis.plotLines.push(
    makePlotLine({
      value: options._now.valueOf(),
      label: t("gageChart.Now"),
    })
  );

  return options;
};

const useGageChartOptions = (
  gage: Gage,
  optionType: string,
  chartDataType: GageChartDataType,
  range?: Range
) => {
  const rootStore = useStores();
  const { t } = useLocale();

  const [isVisible, setIsVisible] = useState(false);
  const [options, setOptions] = useState<[Highcharts.Options, DataPoint]>([{}, null]);

  // Move chart calculations to the next tick to prevent blocking the UI
  useTimeout(() => {
    setIsVisible(true);
  }, Timing.instant);

  const getOptions = () => {
    return CHART_OPTIONS[optionType](
      buildBasicOptions(
        {
          timezone: rootStore.getTimezone(),
          gage,
          chartDataType,
        },
        t
      ),
      gage,
      range,
      t
    );
  };

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    if (!gage?.locationId) {
      return;
    }

    setOptions(getOptions());
  }, [
    isVisible,
    gage?.locationId,
    optionType,
    chartDataType,
    range,
    gage?.dataPoints,
    gage?.actualPoints,
    gage?.predictedPoints,
    gage?.noaaForecastData,
  ]);

  return options;
};

export default useGageChartOptions;
