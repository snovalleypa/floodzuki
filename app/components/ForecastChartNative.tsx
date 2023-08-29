import React from "react";

import {
  VictoryChart,
  VictoryLine,
  VictoryAxis,
  VictoryScatter,
  VictoryLegend,
} from "victory-native";
import { Dimensions } from "react-native";
import { CHART_HEIGHT } from "./ForecastChart";

interface ChartsProps {
  options: ForecastChartOptions
}

type DataPoint = {
  x: number, // timestamp
  xLabel: string, // formatted date
  y: number, // discharge
  isForecast: boolean
}

type SeriesItem = {
  name: string,
  data: DataPoint[],
  color: string,
  marker: {
    enabled: boolean,
    radius: number,
    states: {
      hover: {
        enabled: boolean
      }
    }
  }
}

type PlotLine =  {
  color: string,
  dashStyle: string, // only "dot" is supported
  width: number,
  value: number, // timestamp
  label:{
    text: string,
    style:{
      color: string
    },
    rotation: number
  }
}

type ForecastChartOptions = {
  chart: {
    type: string,
    spacingLeft: number,
    spacingRight: number,
    animation: boolean
  },
  time:{
    useUTC: boolean,
    timezone: string // Timezone
  },
  xAxis:{
    type: string, // Only "datetime" is supported
    min: number, // start of range
    max: number, // end of range
    plotLines: PlotLine[]
  },
  yAxis:{
    startOnTick:false,
    endOnTick:false,
    plotBands:[
      {
        from: number,
        to: number,
        color: string
      }
    ],
    plotLines: PlotLine[],
    softMax: number, // max value
    title: {
      text: string,
    }
  },
  series: SeriesItem[]
}

/**
 * Expected options that we know how to work with
 * 
 *
{
  chart:{
    type:"spline",
    spacingLeft:0,
    spacingRight:5,
    animation:false
  },
  time:{
    useUTC:true,
    timezone:"America/Los_Angeles"
  },
  title:{
    text:null
  },
  plotOptions:{
    series:{
      animation:{
        duration:0
      },
      states:{
        inactive:{
          opacity:1
        }
      },
      turboThreshold:2000
    }
  },
  tooltip:{
    
  },
  xAxis:{
    type:"datetime",
    min:1692995322543,
    max:1694118522543,
    dateTimeLabelFormats:{
      second:"%H:%M:%S",
      minute:"%a, %l:%M %p",
      hour:"%a, %l %p",
      day:"%a, %b %e",
      week:"%e. %b",
      month:"%b '%y"
    },
    plotLines:[
      {
        color:"#999",
        dashStyle:"dot",
        width:1,
        value:1693254522543,
        label:{
          text:"now",
          style:{
            color:"#969BAB"
          },
          rotation:90
        }
      }
    ]
  },
  yAxis:{
    startOnTick:false,
    endOnTick:false,
    plotBands:[
      {
        from:20000,
        to:10000000,
        color:"rgba(68, 170, 213, 0.1)"
      }
    ],
    plotLines:[
      {
        color:"#999",
        width:1,
        value:20000,
        dashStyle:"dash",
        label:{
          text:"Flood Stage: Falls/Carnation",
          style:{
            color:"#606060"
          }
        }
      }
    ],
    softMax:20500,
    title:{
      text:"Discharge (cfs)"
    }
  },
  series:[
    {
      animation:false,
      name:"Observed: Sum of the 3 forks",
      data:[
        {
          x:1693276200000,
          xLabel:"Mon, Aug 28, 7:30 PM",
          y:160.4,
          isForecast:false
        },
        ...
      ],
      color:"#0000FF",
      fillOpacity:0.5,
      threshold:0,
      lineWidth:2,
      states:{
        hover:{
          lineWidth:3
        }
      },
      marker:{
        enabled:false,
        radius:2,
        states:{
          hover:{
            enabled:true
          }
        }
      }
    },
    {
      animation:false,
      name:"Forecast: Sum of the 3 forks",
      data:[
        {
          x:1693270800000,
          xLabel:"Mon, Aug 28, 6:00 PM",
          y:156,
          isForecast:true
        },
        ...
      ],
      fillOpacity:0,
      color:"#0000FF",
      threshold:0,
      lineWidth:2,
      states:{
        hover:{
          lineWidth:3
        }
      },
      marker:{
        symbol:"circle"
      }
    },
    {
      animation:false,
      name:"Observed: Below the Falls",
      data:[
        {
          x:1693273500000,
          xLabel:"Mon, Aug 28, 6:45 PM",
          y:258,
          stage:2.06,
          isForecast:false
        },
        ...
      ],
      color:"#008000",
      fillOpacity:0.5,
      threshold:0,
      lineWidth:2,
      states:{
        hover:{
          lineWidth:3
        }
      },
      marker:{
        enabled:false,
        radius:2,
        states:{
          hover:{
            enabled:true
          }
        }
      }
    },
    {
      animation:false,
      name:"Forecast: Below the Falls",
      data:[
        {
          x:1693270800000,
          xLabel:"Mon, Aug 28, 6:00 PM",
          y:278,
          stage:2.12,
          isForecast:true
        },
        ...
      ],
      fillOpacity:0,
      color:"#008000",
      threshold:0,
      lineWidth:2,
      states:{
        hover:{
          lineWidth:3
        }
      },
      marker:{
        symbol:"circle"
      }
    },
    {
      animation:false,
      name:"Observed: Carnation",
      data:[
        {
          x:1693276200000,
          xLabel:"Mon, Aug 28, 7:30 PM",
          y:451,
          stage:44.76,
          isForecast:false
        },
        ...
      ],
      color:"#800000",
      fillOpacity:0.5,
      threshold:0,
      lineWidth:2,
      states:{
        hover:{
          lineWidth:3
        }
      },
      marker:{
        enabled:false,
        radius:2,
        states:{
          hover:{
            enabled:true
          }
        }
      }
    },
    {
      animation:false,
      name:"Forecast: Carnation",
      data:[
        {
          x:1693270800000,
          xLabel:"Mon, Aug 28, 6:00 PM",
          y:461.79,
          stage:44.77,
          isForecast:true
        },
        ...
      ],
      fillOpacity:0,
      color:"#800000",
      threshold:0,
      lineWidth:2,
      states:{
        hover:{
          lineWidth:3
        }
      },
      marker:{
        symbol:"circle"
      }
    }
  ]
}
 * 
 */

export const ForecastChartNative = (props: ChartsProps) => {
  const { options } = props

  const lines = options?.series ?? []
  const dots = options?.series.filter(s => s.marker?.enabled !== false) ?? []

  const labelData = lines.map(line => ({
    name: line.name,
    symbol: line.marker?.enabled !== false ?
      {
        fill: line.color,
        type: "circle",
      } : {
        fill: line.color,
        type: "minus",
      },
  }))

  const legendWidth = 210;
  const screenWidth = Dimensions.get('window').width
  const legendOffset = screenWidth - legendWidth;

  const nowLabel = options.xAxis.plotLines[0]
  const floodStage = options.yAxis.plotLines[0]

  return (
    <VictoryChart
      domain={{
        x: [options.xAxis.min, options.xAxis.max],
        y: [0, options.yAxis.softMax],
      }}
      maxDomain={options.yAxis.softMax}
      height={CHART_HEIGHT}
      scale={{
        x: "time",
        y: "sqrt",
      }}
    >
      <VictoryLegend
        x={legendOffset}
        rowGutter={-10}
        data={labelData}
        style={{
          data: { strokeWidth: 1 },
          labels: { fontSize: 10 },
        }}
      />
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
            color: "#969BAB",
            padding: 38,
            fontSize: 12,
          },
          grid: {
            stroke: "rgba(150,155,171, 0.2)",
            strokeWidth: 0.5,
          },
        }}
        tickCount={3}
        tickFormat={(t) => `${Math.round(t/1000)}k`}
        label={options.yAxis.title.text}
      />
      {/* Horizontal Axis */}
      <VictoryAxis
        style={{
          axis: {
            stroke: "#969BAB",
          },
          ticks: { stroke: "#969BAB", size: 5 },
        }}
        tickCount={2}
      />
      {/* Lines on the chart */}
      {lines.map(line => (
        <VictoryLine
          key={line.name}
          data={line.data}
          interpolation="natural"
          style={{
            data: {
              stroke: line.color,
              strokeWidth: 2,
            },
          }}
        />
      ))}
      {/* Dots on the chart */}
      {dots.map(dot => (
        <VictoryScatter
          key={dot.name}
          data={dot.data}
          size={2}
          style={{
            data: {
              fill: dot.color,
            },
          }}
        />
      ))}
      {/* Flooding label */}
      <VictoryAxis
        domain={[options.xAxis.min, options.xAxis.max]}
        axisValue={floodStage?.value + 1200}
        label={floodStage?.label?.text}
        style={{
          axis: {
            stroke: options.yAxis.plotBands[0].color,
            strokeWidth: 20,
            strokeLinecap: "square",
          },
          axisLabel: {
            fill: "#999",
            padding: -5,
            fontSize: 10,
            textAnchor: "end",
          },
          ticks: { stroke: "#969BAB", size: 0 },
          tickLabels: { fill: 'none' }
        }}
      />
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
          },
          ticks: { stroke: "#969BAB", size: 0 },
          tickLabels: { fill: 'none' }
        }}
      />
    </VictoryChart>
  )
}
