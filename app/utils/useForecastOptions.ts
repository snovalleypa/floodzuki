import { useEffect, useState } from "react";

import localDayJs from "@services/localDayJs";

import { GageSummary } from "@models/RootStore";
import { useStores } from "@models/helpers/useStores";
import { Forecast } from "@models/Forecasts";

import { Colors, lightenHexColor } from "@common-ui/constants/colors";
import { useLocale } from "@common-ui/contexts/LocaleContext";
import { isMobile } from "@common-ui/utils/responsive";

const STAGE_TWO_YAXIS_MARGIN = 500;

interface BuildOptionsProps {
  daysBefore: number;
  daysAfter: number;
  forecasts: Forecast[];
  gages: GageSummary[];
  timezone: string;
}

const shouldShowFloodLine = (forecast: Forecast, isCombinedForecast: boolean) => {
  if (!isCombinedForecast) {
    return true;
  }
  
  // For the combined forecast, only show Falls.
  return (forecast?.noaaSiteId === "SQUW1");
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
}

const buildSeries = (forecasts: Forecast[], gages: GageSummary[], t) => {
  const series = []

  forecasts.forEach((forecast) => {
    const gage = gages.find(g => g.id === forecast.id)

    const dataPoints = forecast.chartReadings

    const seriesName = `${t("forecastChart.observed")}: ${gage?.title}`

    const normalizedDataPoints = dataPoints.map((p) => {
      return {
        ...p,
        name: seriesName
      }
    })
    
    // Data Points
    series.push({
      animation:false,
      name: seriesName,
      data: normalizedDataPoints,
      color: gage?.color,
      fillOpacity: 0.5,
      threshold: 0,
      lineWidth: 2,
      states: {
        hover: {
          lineWidth: 3,
        },
      },

      //$ todo
      marker: {
        enabled: false,
        radius: 2,
        states: {
          hover: {
            enabled: true,
          },
        },
      },
    })

    const forecastDataPoints = forecast.chartForecastReadings

    const forecastName = `${t("forecastChart.forecast")}: ${gage?.title}`

    const noramlizedForecastDataPoints = forecastDataPoints.map((p) => {
      return {
        ...p,
        name: forecastName
      }
    })

    // Forecast Data Points
    series.push({
      animation:false,
      name: `${t("forecastChart.forecast")}: ${gage?.title}`,
      data: noramlizedForecastDataPoints,
      fillOpacity: 0,
      color: isMobile ? lightenHexColor(gage?.color) : gage?.color,
      threshold: 0,
      lineWidth: 2,
      states: {
        hover: {
          lineWidth: 3,
        },
      },
      marker: {
        symbol: 'circle'
      }
    });
  })

  return series
}

const buildOptions = (props: BuildOptionsProps, t) => {
  const {
    daysBefore,
    daysAfter,
    forecasts,
    gages,
    timezone
  } = props

  let stageTwo = 0
  const isCombinedForecast = forecasts.length > 1;
  const floodLines = []
  
  const now = localDayJs.tz()

  const min = now.clone().subtract(daysBefore, "days")
  const max = now.clone().add(daysAfter, "days")

  // Find appropriate flood/warning levels for this chart.  For the combined chart we want to
  // find the highest available levels for the warning bands; we will go ahead and show a flood-stage line
  // for every available forecast.
  forecasts.forEach((f) => {
    if (f.dischargeStageTwo) {
      if (f.dischargeStageTwo > stageTwo) {
        stageTwo = f.dischargeStageTwo;
      }
      
      const showFloodLine = shouldShowFloodLine(f, isCombinedForecast);
      
      if (showFloodLine) {
        floodLines.push({
          color: "#999",
          width: 1,
          value: f.dischargeStageTwo,
          dashStyle: "dash",
          label: {
            text: `${t("forecastChart.floodStage")}: ${getFloodStageLabel(f, isCombinedForecast)}`,
            style: {
              color:  '#606060'
            }
          }
        })
      }
    }
  })

  // Display flooding level
  const floodBands = [{
    from: stageTwo,
    to:  10000000,
    color: 'rgba(68, 170, 213, 0.1)'
  }];

  const options: Highcharts.Options = {
    chart: {
      type: "spline",
      spacingLeft: 0,
      spacingRight: 5,
      animation: false,
    },
    time: {
      useUTC: true,
      timezone: timezone
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
      }
    },
    tooltip: {
      formatter: function () {
        let stageDisplay = ""

        if (this.point?.options?.stage) {
          stageDisplay = `/ ${this.point?.options?.stage} ft`
        }

        return `<b>${this.series.name}</b><br/>${this.point?.options?.xLabel}: ${this.y} cfs ${stageDisplay}`
      }
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
      plotLines: [{
        color: '#999',
        dashStyle: "dot",
        width: 1,
        value: now.valueOf(),
        label: {
          text : t("forecastChart.now"),
          style: {
            color:  Colors.darkGrey
          },
          rotation: 90,
        }
      }],
    },
    yAxis: {
      startOnTick: false,
      endOnTick: false,
      plotBands: floodBands,
      plotLines: floodLines,
      softMax: stageTwo + STAGE_TWO_YAXIS_MARGIN,
      title: {
        text: `${t("forecastChart.discharge")} (${t("measure.cfs")})`,
      },
    },
    series: buildSeries(forecasts, gages, t)
  }

  return options
}

const useForecastOptions = (gages: GageSummary[], daysBefore: number, daysAfter: number) => {
  const { t } = useLocale()
  const rootStore = useStores()

  const gageIds = gages.map(gage => gage?.id)
  const forecasts = rootStore.getForecasts(gageIds)

  const [options, setOptions] = useState<Highcharts.Options>({})

  useEffect(() => {
    setOptions(buildOptions({
      daysBefore,
      daysAfter,
      forecasts,
      gages,
      timezone: rootStore.getTimezone()
    }, t))
  }, [gages, daysBefore, daysAfter])

  return options
}

export default useForecastOptions
