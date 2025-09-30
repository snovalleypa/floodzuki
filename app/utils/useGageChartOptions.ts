import { useEffect, useState } from "react"
import dayjs from "dayjs"

import { Gage, GageChartDataType } from "@models/Gage"
import { useTimeout } from "./useTimeout"
import { useStores } from "@models/helpers/useStores"

import localDayJs from "@services/localDayJs"
import Config from "@config/config"
import { Colors } from "@common-ui/constants/colors"
import { DataPoint } from "@models/Forecasts"
import { useLocale } from "@common-ui/contexts/LocaleContext"
import { Timing } from "@common-ui/constants/timing"

interface Range {
  chartStartDate: dayjs.Dayjs
  chartEndDate: dayjs.Dayjs
}

interface BuildOptionsProps {
  timezone: string
  gage: Gage
  chartDataType: GageChartDataType

}

const DEBUGGING_TIMESPAN_MARGIN = 0; // 300;
const PREDICTION_WINDOW_MINUTES = 60 * 6; // 6 hours of predictions

const CHART_OPTIONS = {
  dashboardOptions: (options: Highcharts.Options, gage: Gage, range: Range, t) => {
    options.chart.height = 182;
    options.xAxis.labels = { enabled: false };
    options.xAxis.tickLength = 0;
    options.yAxis.labels = { enabled: false };
    options.yAxis.gridLineWidth = 0;
    options.yAxis.title = null;

    for (const line of options.yAxis.plotLines || []) {
      line.label.style.fontSize = "11px";
      line.label.align = "center";
      line.label.x = 0;
    }

    options.xAxis.max = options._now.valueOf();

    const chartBeginTime = options._now.clone().subtract(
      Config.FRONT_PAGE_CHART_DURATION_NUMBER,
      Config.FRONT_PAGE_CHART_DURATION_UNIT
    );

    options.xAxis.min = chartBeginTime
      .clone()
      .subtract(20, "m")
      .valueOf();

    options.xAxis.plotLines.push({
      value: chartBeginTime.valueOf(),
      dashStyle: "dot",
      color: "#9a9a9a",
      label: {
        text: t("gageChart.dashboardDurationLabel"),
        style: { color: "#9a9a9a" },
        align: "left",
      },
    });

    return [options, null] as const
  },

  gageDetailsOptions: (
    options: Highcharts.Options,
    gage: Gage,
    range: Range,
    t
  ) => {
    let predictionWindow = 0;
    
    if (gage?.predictedPoints) {
      predictionWindow = PREDICTION_WINDOW_MINUTES;
    }

    options.xAxis.max = range.chartEndDate
      .clone()
      .add(predictionWindow, "m")
      .add(DEBUGGING_TIMESPAN_MARGIN,"m")
      .valueOf();

    options.xAxis.min = range.chartStartDate
      .clone()
      .subtract(DEBUGGING_TIMESPAN_MARGIN,"m")
      .valueOf();

    const crest = calculateCrest(
      gage?.dataPoints,
      {
        startDate: range.chartStartDate,
      }
    );
    
    if (crest) {
      options.xAxis.plotLines = options.xAxis.plotLines || [];
      options.xAxis.plotLines.push(
        makePlotLine({
          value: crest.timestamp.valueOf(),
          label: `${t("measure.max")} ${crest.reading.toFixed(2)} ${t("measure.ft")}`,
        })
      );
    }

    return [options, crest] as const
  }
}

function calculateCrest(
  dataPoints: DataPoint[],
  {
    startDate = localDayJs("1970-01-01"),
    endDate = localDayJs(),
  } = {}
) {
  const points = dataPoints.filter(
    point => point.timestamp >= startDate && point.timestamp <= endDate
  );

  if (points.length < 3) return null;
  
  const [min, max] = points.reduce(
    (mm, d) => [Math.min(d.reading, mm[0]), Math.max(d.reading, mm[1])],
    [+Infinity, -Infinity]
  );
  
  // max has to be 1' greater than min
  if (max < min + 1) {
    return null;
  }
  
  //has to be greater then 1st and last points
  if (
    max === points[0].reading ||
    max === points[points.length - 1].reading
  ) {
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

function dataPointPopup(gage: Gage, t) {
  return function() {
    const roadStatus = gage?.getCalculatedRoadStatus(this.y);
    
    let roadDesc = "";
    
    if (roadStatus) {
      roadDesc = `<br />
        <span class="data-point-content">${roadStatus.deltaFormatted}</span>
        <span class="data-point-title"> ${t(`statusLevelsCard.${roadStatus?.preposition}`)} ${t("calloutReading.roadSmall")}</span>`;
    }
    return ` <div class="data-point">
        <span class="data-point-title">${this.point.isPrediction ? t("statusLevelsCard.predicted") : t("statusLevelsCard.water")} ${t("statusLevelsCard.level")}: </span>
        <span class="data-point-content">
          ${this.y?.toFixed(2)} ${t("measure.ft")}.
        </span>
        <br />
        <span class="data-point-content">
          ${localDayJs.tz(this.x, gage?.timeZoneName).format("ddd, MMM D, h:mm A")}
        </span>
        ${roadDesc}
      </div>`;
  };
}

function makePlotLine({ value, label, color = "#9a9a9a" }) {
  return {
    value,
    dashStyle: "dot",
    color,
    label: {
      text: label,
      style: { color },
      rotation: 270,
      align: "right",
      x: -5,
    },
  };
}

function createPredictionSeries(dataPoints: DataPoint[], t, groundHeight: number, color: string) {
  return {
    animation:false,
    name: "predicted gage height",
    data: dataPoints.map(d => ({
      x: d.timestamp.valueOf(),
      y: d.reading,
      name: `${t("statusLevelsCard.predicted")} ${t("statusLevelsCard.level")}: `,
      isPrediction: true
    })),
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

function createActualDataSeries(dataPoints: DataPoint[], t, groundHeight: number, color: string) {
  return {
    animation:false,
    name: "actual gage height",
    data: dataPoints.map(d => ({
      x: d.timestamp.valueOf(),
      y: d.reading,
      ts: d.timestamp,
      name: `${t("statusLevelsCard.water")} ${t("statusLevelsCard.level")}: `,
      isPrediction: false
    })),
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

function createForecastDataSeries(dataPoints: DataPoint[], t, groundHeight: number, color: string) {
    return {
      animation:false,
      name: "forecast gage height",
      data: dataPoints.map(d => ({
        x: d.timestamp.valueOf(),
        y: d.reading,
        name: `${t("statusLevelsCard.predicted")} ${t("statusLevelsCard.level")}: `,
        isPrediction: true
      })),
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

function createSeriesAndReturnMin(dataPoints, gage, t, color, setIsPrediction, chartDataType) {
  let data = null;
  let min = Math.min.apply(null, dataPoints.map(d => d.reading));
  
  if (setIsPrediction) {
    if (chartDataType === GageChartDataType.DISCHARGE) {
      data = dataPoints.map(d => ({
        x: d.timestamp.valueOf(),
        y: d.waterDischarge,
        name: `${t("statusLevelsCard.water")} ${t("statusLevelsCard.level")}: `,
        ts: d.timestamp?.format(),
        isPrediction: false
      }))
    } else {
      data = dataPoints.map(d => ({
        x: d.timestamp.valueOf(),
        y: d.reading,
        name: `${t("statusLevelsCard.water")} ${t("statusLevelsCard.level")}: `,
        ts: d.timestamp?.format(),
        isPrediction: false
      }))
    }
  } else {
    if (chartDataType === GageChartDataType.DISCHARGE) {
      data = dataPoints.map(d => {
        return {
          x: d.timestamp.valueOf(),
          y: d.waterDischarge,
          name: `${t("statusLevelsCard.predicted")} ${t("statusLevelsCard.level")}: `,
        };
      });
    } else {
      data = dataPoints.map(d => {
        return {
          x: d.timestamp.valueOf(),
          y: d.reading,
          name: `${t("statusLevelsCard.predicted")} ${t("statusLevelsCard.level")}: `,
        };
      });
    }
  }

  const series = []
  
  series.push({
    animation:false,
    name: "gage height",
    data: data,
    color: color,
    fillOpacity: 0.5,
    threshold: gage?.groundHeight,
    lineWidth: 2,
    gapUnit: "value",
    gapSize: localDayJs.duration(2, "hours").asMilliseconds(),
    states: {
      hover: {
        lineWidth: 3,
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

function createDataAndReturnMin(gage: Gage, chartDataType: GageChartDataType, t) {
  let hasPredictions = false;
  const chartData = [];

  // Get predicted points
  if (gage?.predictedPoints.length > 0) {
    chartData.push(createPredictionSeries(gage?.predictedPoints, t, gage?.groundHeight, Colors.gageChartPredictionsLineColor));
    hasPredictions = true;
  }

  // Get actual points
  if (gage?.actualPoints.length > 0) {
    chartData.push(createActualDataSeries(gage?.actualPoints, t, gage?.groundHeight, Colors.gageChartActualDataLineColor));
  }

  // Get forecast points
  if (gage?.noaaForecastData.length > 0) {
    chartData.push(createForecastDataSeries(gage?.noaaForecastData, t, gage?.groundHeight, Colors.gageChartForecastDataLineColor));
  }

  // Get readings
  const dataPoints = gage?.dataPoints;

  let min = 0;
  
  const readings = dataPoints.slice().filter(d => !d.isDeleted).reverse();
  const deletedReadings = dataPoints.slice().filter(d => d.isDeleted).reverse();

  const [readingsSeries, seriesMin] = createSeriesAndReturnMin(readings, gage, t, Colors.gageChartColor, hasPredictions, chartDataType);
  min = seriesMin;
  
  chartData.push(...readingsSeries)
  
  if (deletedReadings.length > 0) {
    const [deletedReadingsSeries, deletedSeriesMin] = createSeriesAndReturnMin(dataPoints, gage, t, Colors.gageChartDeletedLineColor, false, chartDataType);
    chartData.push(...deletedReadingsSeries)
    min = Math.min(seriesMin, deletedSeriesMin);
  }

  return [chartData, min] as const;
}

const buildBasicOptions = (props: BuildOptionsProps, t) => {
  const { gage, chartDataType } = props

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
          inactive: { opacity: 1},
        },
        turboThreshold: 2000,
      },
      area: { fillOpacity: 0.5, animation: false }
    },
    tooltip: {
      useHTML: true,
      formatter: dataPointPopup(gage, t),
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
      type: (chartDataType === GageChartDataType.DISCHARGE) ? "logarithmic" : "linear",
      startOnTick: false,
      endOnTick: false,
      title: {
        text: (chartDataType === GageChartDataType.DISCHARGE) ?
          `${t('gageChart.discharge')} (${t('measure.cfs')})` :
          `${t('gageChart.waterLevel')} (${t('measure.ft')}.)`,
      },
    },
  };

  const [series, minVal] = createDataAndReturnMin(gage, chartDataType, t);

  const { yMaximum, yMinimum } = gage?.getChartMinAndMax(chartDataType);

  options.series = series;
  const yAxisMin = Math.max(gage?.groundHeight || 0, yMinimum);
  options.yAxis.min = Math.min(minVal, yAxisMin);
  options.yAxis.max = yMaximum;

  options.yAxis.plotLines = (gage?.roads).map(cat => {
    return {
      value: cat.elevation,
      label: {
        text: cat.name,
        style: {
          color: Colors.primary,
          fontFamily: "'Open Sans', sans-serif",
          fontSize: "14px",
        },
        align: "right",
        x: -10,
      },
      color: Colors.primary,
      dashStyle: "dot",
    };
  });

  options._now = localDayJs();

  options.xAxis.plotLines = [];
  options.xAxis.plotLines.push(
    makePlotLine({
      value: options._now.valueOf(),
      label: t("gageChart.Now")
    })
  );

  return options
}

const useGageChartOptions = (
  gage: Gage,
  optionType: string,
  chartDataType: GageChartDataType,
  range?: Range
) => {
  const rootStore = useStores()
  const { t } = useLocale()

  const [isVisible, setIsVisible] = useState(false)
  const [options, setOptions] = useState<[Highcharts.Options, DataPoint]>([{}, null])

  // Move chart calculations to the next tick to prevent blocking the UI
  useTimeout(() => {
    setIsVisible(true)
  }, Timing.instant)

  const getOptions = () => {
    return CHART_OPTIONS[optionType](
      buildBasicOptions({
        timezone: rootStore.getTimezone(),
        gage,
        chartDataType,
      }, t),
      gage,
      range,
      t
    )
  }

  useEffect(() => {
    if (!isVisible) return

    if (!gage?.locationId) return

    setOptions(getOptions())
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
  ])

  return options
}

export default useGageChartOptions
