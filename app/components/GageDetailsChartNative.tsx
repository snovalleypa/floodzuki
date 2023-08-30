import React from "react";

import {
  VictoryChart,
  VictoryLine,
  VictoryArea,
  VictoryAxis,
  VictoryBar,
  VictoryScatter,
} from "victory-native";


interface ChartsProps {
  options: GageDetailsChartOptions
}

type DataPoint = {
  x: number, // "timestamp"
  y: number, // value
  isPrediction: boolean
}

type SeriesItem = {
  animation: boolean,
  name: string,
  data: DataPoint[],
  fillOpacity: number,
  color: string,
  threshold: number,
  lineWidth: number,
  states: {
    hover: {
      lineWidth: number
    }
  }
}

type PlotLine = {
  value: number, // "timestamp"
  dashStyle: string, // only "dot" is supported
  color: string,
  label: {
    text: string,
    style: {
      color: string
    },
    rotation: number, // rotation degrees
    align: string, // "right"
    color: string,
    x: number // offset
    dashStyle: string // only "dot" is supported
  }
}

type GageDetailsChartOptions = {
  chart: {
    height: number,
    type: string, // only "area" type is supported
    spacingLeft: number,
    spacingRight: number,
    animation: boolean
  },
  xAxis: {
    type: string, // only "datetime" is supported
    plotLines: PlotLine[],
    max: number, // end of range
    min: number // start of range
  },
  yAxis: {
    type: "linear",
    startOnTick: false,
    endOnTick: false,
    title: {
      text: "Water Level (ft.)"
    },
    min: number, // min value
    max: number, // max value
    plotLines: PlotLine[]
  },
  series: SeriesItem[],
  _now: string
}


/**
 * Expected options that we know how to work with
 * 
 * {
  chart: {
    height: 300,
    type: "area",
    spacingLeft: 0,
    spacingRight: 5,
    animation: false
  },
  title: {
    text: null
  },
  legend: {
    enabled: false
  },
  plotOptions: {
    series: {
      animation: {
        duration: 0
      },
      states: {
        inactive: {
          opacity: 1
        }
      },
      turboThreshold: 2000
    },
    area: {
      fillOpacity: 0.5,
      animation: false
    }
  },
  tooltip: {
    useHTML: true
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
      month: "%b '%y"
    },
    plotLines: [
      {
        value: 1693241457420,
        dashStyle: "dot",
        color: "#9a9a9a",
        label: {
          text: "Now",
          style: {
            color: "#9a9a9a"
          },
          rotation: 270,
          align: "right",
          x: -5
        }
      }
    ],
    max: 1693263055746,
    min: 1693068655746
  },
  yAxis: {
    type: "linear",
    startOnTick: false,
    endOnTick: false,
    title: {
      text: "Water Level (ft.)"
    },
    min: 9,
    max: 18,
    plotLines: [
      {
        label: {
          style: {
            color: "#ff7f00",
            fontFamily: "'Open Sans', sans-serif",
            fontSize: "14px"
          },
          align: "right",
          x: -10
        },
        color: "#ff7f00",
        dashStyle: "dot"
      }
    ]
  },
  series: [
    {
      animation: false,
      name: "predicted gage height",
      data: [
        {
          x: 1693239300000,
          y: 10.1,
          isPrediction: true
        },
        ...
      ],
      fillOpacity: 0,
      color: "#ff7f00",
      threshold: 0,
      lineWidth: 1,
      states: {
        hover: {
          lineWidth: 1
        }
      }
    },
    {
      animation: false,
      name: "gage height",
      data: [
        {
          x: 1693069200000,
          y: 10.12,
          ts: "2023-08-26T10:00:00-07:00",
          isPrediction: false
        },
        ...
      ],
      color: "#44b5f2",
      fillOpacity: 0.5,
      threshold: 0,
      lineWidth: 2,
      gapUnit: "value",
      gapSize: 7200000,
      states: {
        hover: {
          lineWidth: 3
        }
      },
      marker: {
        enabled: true,
        radius: 2,
        states: {
          hover: {
            enabled: true
          }
        }
      }
    }
  ],
  _now: "2023-08-28T16:50:57.420Z"
}
 */

const CHART_HEIGHT = 320
const AXIS_COLOR = "#666666"

const $labelStyle = {
  fill: AXIS_COLOR,
  color: AXIS_COLOR,
  fontFamily: "OpenSans_400Regular",
  fontSize: 11,
}

const DOT_SIZE = 2

export const GageDetailsChartNative = (props: ChartsProps) => {
  const { options } = props

  const lines = options?.series ?? []
  const waterLines = lines.filter(line => !!line.fillOpacity)

  const nowLabel = options.xAxis.plotLines[0]
  const roadLabel = options.yAxis.plotLines[0]

  return (
    <VictoryChart
      domain={{
        x: [options.xAxis.min, options.xAxis.max],
        y: [options.yAxis.min, options.yAxis.max],
      }}
      maxDomain={options.yAxis.max}
      minDomain={options.yAxis.min}
      height={CHART_HEIGHT}
      scale={{
        x: "time",
        y: options.yAxis.type === "linear" ? "linear" : "log",
      }}
    >
      {/* Vertical Axis */}
      <VictoryAxis
        dependentAxis
        style={{
          axis: {
            stroke: "#969BAB",
            strokeWidth: 0,
            padding: 40
          },
          axisLabel: {
            ...$labelStyle,
            padding: 38,
            fontSize: 12,
          },
          tickLabels: {
            ...$labelStyle
          },
          grid: {
            stroke: "rgba(150,155,171, 0.2)",
            strokeWidth: 0.5,
          },
        }}
        tickCount={3}
        tickFormat={(t) => t > 1000 ? `${Math.round(t/1000)}k` : t}
        label={options.yAxis.title.text}
      />
      {/* Horizontal Axis */}
      <VictoryAxis
        style={{
          axis: {
            stroke: "#969BAB",
          },
          axisLabel: {
            ...$labelStyle
          },
          tickLabels: {
            ...$labelStyle
          },
          ticks: { stroke: "#969BAB", size: 5 },
        }}
        tickCount={2}
      />
      {/* Road label */}
      <VictoryAxis
        axisValue={roadLabel?.value}
        label={roadLabel?.label?.text}
        style={{
          axis: {
            stroke: roadLabel?.color,
            strokeWidth: roadLabel?.value ? 0.7 : 0,
            strokeDasharray: "3, 5",
          },
          axisLabel: {
            fill: roadLabel?.color,
            fontSize: 12,
            textAnchor: "start",
            padding: -15,
          },
          ticks: { stroke: "#969BAB", size: 0 },
          tickLabels: { fill: 'none' }
        }}
      />
      {/* Dots on the chart */}
      {lines.map(dot => (
        <VictoryScatter
          key={dot.name}
          data={dot.data}
          x={(d) => Array.isArray(d) ? d[0] : d?.x}
          y={(d) => Array.isArray(d) ? d[1] : d?.y}
          size={DOT_SIZE}
          style={{
            data: {
              fill: dot.color,
            },
          }}
        />
      ))}
      {/* Area container */}
      {waterLines.map(area => (
        <VictoryBar
          key={area.name}
          style={{
            data: {
              fill: area.color,
              fillOpacity: area.fillOpacity
            }
          }}
          barWidth={DOT_SIZE}
          barRatio={1}
          data={area.data}
          x={(d) => Array.isArray(d) ? d[0] : d?.x}
          y={(d) => Array.isArray(d) ? d[1] : d?.y}
        />
      ))}
      {/* Now label */}
      <VictoryAxis
        dependentAxis
        scale="sqrt"
        axisValue={nowLabel?.value}
        label={nowLabel?.label?.text}
        style={{
          axis: {
            stroke: "#969BAB",
            strokeWidth: 1,
            strokeDasharray: "1, 5",
          },
          axisLabel: {
            fill: "#969BAB",
            padding: 5,
            fontSize: 12,
          },
          ticks: { stroke: "#969BAB", size: 0 },
          tickLabels: { fill: 'none' }
        }}
      />
    </VictoryChart>
  )
}
