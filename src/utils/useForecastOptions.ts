import { useEffect, useState } from "react";

import { GageSummary } from "@models/RootStore";
import { useStores } from "@models/helpers/useStores";
import { Forecast } from "@models/Forecasts";

import { Colors, lightenHexColor } from "@common-ui/constants/colors";
import { useLocale } from "@common-ui/contexts/LocaleContext";
import { isMobile } from "@common-ui/utils/responsive";
import dayjs from "dayjs";
import { buildForecastTooltipHtml } from "./chartTooltipHtml";

declare module "highcharts" {
  interface PointOptionsObject {
    stage?: number;
  }
}

const STAGE_TWO_YAXIS_MARGIN = 500;

export interface FloodLineOverride {
  gageId: string;
  label: string;
}

interface BuildOptionsProps {
  daysBefore: number;
  daysAfter: number;
  forecasts: Forecast[];
  gages: GageSummary[];
  timezone: string;
  floodLineOverride?: FloodLineOverride;
}

const getFloodStageLabel = (forecast: Forecast, isCombinedForecast: boolean) => {
  switch (forecast?.noaaSiteId) {
    default:
      return "";
    case "SQUW1":
      return isCombinedForecast ? "Falls/Carnation" : "Falls";
    case "CRNW1":
      return "Carnation";
    case "":
      return "Forks";
  }
};

/**
 * Build the y-axis flood-stage plot lines for a forecast chart.
 * - override present  -> draw exactly that gage's stage-two line with its label.
 * - >1 forecast       -> draw only Falls (SQUW1), labeled "Falls/Carnation".
 * - single forecast   -> draw that gage's stage-two line.
 */
export const computeFloodLines = (
  forecasts: Forecast[],
  override: FloodLineOverride | undefined,
  t
) => {
  const lines: any[] = [];
  const isCombinedForecast = forecasts.length > 1;

  const push = (value: number, text: string) => {
    lines.push({
      color: "#999",
      width: 1,
      value,
      dashStyle: "dash",
      label: { text: `${t("forecastChart.floodStage")}: ${text}`, style: { color: "#606060" } },
    });
  };

  if (override) {
    const f = forecasts.find((x) => x.id === override.gageId);
    if (f?.dischargeStageTwo) {
      push(f.dischargeStageTwo, override.label);
    }
    return lines;
  }

  forecasts.forEach((f) => {
    if (!f.dischargeStageTwo) {
      return;
    }
    const show = !isCombinedForecast || f.noaaSiteId === "SQUW1";
    if (show) {
      push(f.dischargeStageTwo, getFloodStageLabel(f, isCombinedForecast));
    }
  });

  return lines;
};

const buildSeries = (
  forecasts: Forecast[],
  gages: GageSummary[],
  softMax: number,
  t,
  tz: string
) => {
  const series = [];
  let maxValue = softMax;

  forecasts.forEach((forecast) => {
    const gage = gages.find((g) => g.id === forecast.id);

    const dataPoints = forecast.chartReadings;

    const seriesName = `${t("forecastChart.observed")}: ${gage?.title}`;

    const normalizedDataPoints = dataPoints.map((p) => {
      if (p.y > maxValue) {
        maxValue = p.y;
      }

      return {
        ...p,
        name: seriesName,
        shortName: gage?.title,
        tooltipHtml: buildForecastTooltipHtml({
          tz,
          seriesName,
          x: p.x,
          y: p.y,
          stage: p.stage,
        }),
      };
    });

    // One legend entry per gage: the observed series is the legend item
    // (labeled with just the gage title), and the forecast series links to
    // it via `linkedTo` so it shares the same legend entry and toggle.
    const seriesId = `gage-${forecast.id}`;

    series.push({
      animation: false,
      id: seriesId,
      name: gage?.title,
      data: normalizedDataPoints,
      color: gage?.color,
      fillOpacity: 0.5,
      threshold: 0,
      lineWidth: 2,
      states: { hover: { lineWidth: 3 } },
      marker: {
        enabled: false,
        radius: 2,
        states: { hover: { enabled: true } },
      },
    });

    const forecastDataPoints = forecast.chartForecastReadings;
    const forecastName = `${t("forecastChart.forecast")}: ${gage?.title}`;

    const noramlizedForecastDataPoints = forecastDataPoints.map((p) => {
      if (p.y > maxValue) {
        maxValue = p.y;
      }

      return {
        ...p,
        name: forecastName,
        shortName: gage?.title,
        tooltipHtml: buildForecastTooltipHtml({
          tz,
          seriesName: forecastName,
          x: p.x,
          y: p.y,
          stage: p.stage,
        }),
      };
    });

    series.push({
      animation: false,
      name: forecastName,
      linkedTo: seriesId,
      data: noramlizedForecastDataPoints,
      fillOpacity: 0,
      color: isMobile ? lightenHexColor(gage?.color) : gage?.color,
      threshold: 0,
      lineWidth: 2,
      states: { hover: { lineWidth: 3 } },
      marker: { symbol: "circle", enabled: true, radius: 3 },
    });
  });

  return [series, maxValue] as const;
};

const buildOptions = (props: BuildOptionsProps, t) => {
  const { daysBefore, daysAfter, forecasts, gages, timezone } = props;

  const now = dayjs();

  const min = now.clone().subtract(daysBefore, "days");
  const max = now.clone().add(daysAfter, "days");

  // Find the highest available stage-two level for the warning bands.
  let stageTwo = 0;
  forecasts.forEach((f) => {
    if (f.dischargeStageTwo && f.dischargeStageTwo > stageTwo) {
      stageTwo = f.dischargeStageTwo;
    }
  });

  const floodLines = computeFloodLines(forecasts, props.floodLineOverride, t);

  // Display flooding level
  const floodBands = [
    {
      from: stageTwo,
      to: 10000000,
      color: "rgba(68, 170, 213, 0.1)",
    },
  ];

  const [series, chartMax] = buildSeries(forecasts, gages, stageTwo, t, timezone);

  const options: Highcharts.Options = {
    chart: {
      type: "spline",
      spacingLeft: 0,
      spacingRight: 5,
      animation: false,
    },
    time: {
      timezone: timezone,
    },
    title: {
      text: null,
    },
    plotOptions: {
      series: {
        animation: { duration: 0 },
        states: {
          inactive: { opacity: 1 },
        },
        turboThreshold: 2000,
      },
    },
    tooltip: {
      useHTML: true,
    },
    xAxis: {
      type: "datetime",
      min: min.valueOf(),
      max: max.valueOf(),
      dateTimeLabelFormats: {
        second: "%H:%M:%S",
        minute: "%a, %l:%M %p",
        hour: "%a, %l %p",
        day: "%a, %b %e",
        week: "%e. %b",
        month: "%b '%y",
      },
      plotLines: [
        {
          color: "#999",
          dashStyle: "Dot",
          width: 1,
          value: now.valueOf(),
          label: {
            text: t("forecastChart.now"),
            style: {
              color: Colors.darkGrey,
            },
            rotation: 90,
          },
        },
      ],
    },
    yAxis: {
      startOnTick: false,
      endOnTick: false,
      plotBands: floodBands,
      plotLines: floodLines,
      softMax: stageTwo + STAGE_TWO_YAXIS_MARGIN,
      max: chartMax + STAGE_TWO_YAXIS_MARGIN,
      title: {
        text: `${t("forecastChart.discharge")} (${t("measure.cfs")})`,
      },
    },
    series: series,
  };

  return options;
};

const useForecastOptions = (
  gages: GageSummary[],
  daysBefore: number,
  daysAfter: number,
  floodLineOverride?: FloodLineOverride
) => {
  const { t } = useLocale();
  const rootStore = useStores();

  const gageIds = gages.map((gage) => gage?.id);
  const forecasts = rootStore.getForecasts(gageIds);

  const [options, setOptions] = useState<Highcharts.Options>({});

  useEffect(() => {
    setOptions(
      buildOptions(
        {
          daysBefore,
          daysAfter,
          forecasts,
          gages,
          timezone: rootStore.getTimezone(),
          floodLineOverride,
        },
        t
      )
    );
  }, [gages, daysBefore, daysAfter, floodLineOverride?.gageId, floodLineOverride?.label]);

  return options;
};

export default useForecastOptions;
