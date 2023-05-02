import React, { useState } from "react"
import { View } from "react-native"
import { observer } from "mobx-react-lite"
import {Circle, G, Line, Path, Svg, Text} from 'react-native-svg'
import * as d3 from "d3"

import { Gage, GageChartDataType } from "@models/Gage"
import { Colors } from "@common-ui/constants/colors"
import { If } from "@common-ui/components/Conditional"
import { t } from "@i18n/translate"

const CHART_HEIGHT = 182
const OFFSET_BOTTOM = 10
const OFFSET_LEFT = 10
const OFFSET_RIGHT = 10
const BOTTOM_PADDING = 16

const STROKE_COLOR = "#9a9a9a"

const isPathSafe = (path: string) => {
  return path && path.length > 0 && !path.match("NaN")
}

const useChartData = (gage: Gage, layout) => {
  const { width, height } = layout

  const data = gage.chartReadings
  const { yMinimum, yMaximum } = gage.getChartMinAndMax(GageChartDataType.LEVEL)
  const yAxisMin = Math.max(gage.groundHeight ?? 0, yMinimum);

  const x = d3.scaleTime()
      .domain(d3.extent(data, function(d) { return d.date; }))
      .range([ OFFSET_LEFT, width - OFFSET_RIGHT ]);

  const y = d3.scaleLinear()
      .domain([yAxisMin, yMaximum])
      .range([height - 16, 16]);

  const yAxis = (v: number) => {
    const result = y(v)

    if (isNaN(result)) {
      return y(yAxisMin)
    }

    return result
  }

  const area = d3.area()
      .x(function(d) { return x(d.date); })
      .y0(height)
      .y1(function(d) { return yAxis(d.value); })

  const line = d3.line()
    .x(function(d) { return x(d.date); })
    .y(function(d) { return yAxis(d.value); })

  const roadHeight = y(gage?.roads[0]?.elevation)

  const circles = (data) => {
    const circleData = data.map((d,) => ({
      cx: x(d.date),
      cy: yAxis(d.value),
      r: 2,
    }))

    return circleData.filter((c,i) => circleData.indexOf(c) === i)
  }
      
  
  return [area(data), line(data), circles(data), roadHeight]
}

const GageListItemChart = observer(
  function GageListItemChart({ gage }: { gage: Gage }) {
    const [layout, setLayout] = useState({ width: 0, height: 182 })

    const handleLayout = (event) => {
      const { width, height } = event.nativeEvent.layout
      setLayout({ width, height })
    }

    const height = CHART_HEIGHT

    const [areaData, lineData, circleData, roadHeight] = useChartData(gage, layout)

    return (
      <View style={{ flex: 1, height: CHART_HEIGHT }} onLayout={handleLayout}>
        <Svg
          width={layout.width}
          height={height}
          strokeWidth={layout.width}
        >
          <G>
            {/* Left line */}
            <Line
              stroke={STROKE_COLOR}
              strokeWidth="1"
              strokeDasharray={[2, 4]}
              x1={OFFSET_LEFT}
              y1={OFFSET_BOTTOM}
              x2={OFFSET_LEFT}
              y2={height}
            />
            <Text
              x={OFFSET_LEFT + 5}
              y={BOTTOM_PADDING + 20}
              fontSize="10"
              fill={STROKE_COLOR}
              textAnchor="middle"
              transform={{ rotation: 90, originX: 0, originY: BOTTOM_PADDING + 35 }}
            >
              {t("gageChart.dashboardDurationLabel")}
            </Text>
            {/* Right line */}
            <Line
              stroke={STROKE_COLOR}
              strokeWidth="1"
              strokeDasharray={[2, 4]}
              x1={layout.width - OFFSET_RIGHT}
              y1={OFFSET_BOTTOM}
              x2={layout.width - OFFSET_RIGHT}
              y2={height}
            />
            <Text
              x={layout.width - OFFSET_RIGHT - 5}
              y={BOTTOM_PADDING + 20}
              fontSize="10"
              fill={STROKE_COLOR}
              textAnchor="end"
              transform={{ rotation: -90, originX: layout.width, originY: BOTTOM_PADDING + 35 }}
            >
              {t("gageChart.Now")}
            </Text>
            {/* Bottom line */}
            <Line
              stroke={STROKE_COLOR}
              strokeWidth="1"
              x1={OFFSET_LEFT / 2}
              y1={height}
              x2={layout.width - OFFSET_RIGHT / 2}
              y2={height}
            />
            <If condition={roadHeight > 0}>
              {/* Road Line */}
              <Line
                stroke={Colors.primary}
                strokeWidth="1"
                strokeDasharray={[1, 3]}
                x1={OFFSET_LEFT / 2}
                y1={roadHeight}
                x2={layout.width - OFFSET_RIGHT / 2}
                y2={roadHeight}
              />
              <Text
                x={layout.width / 2}
                y={roadHeight - OFFSET_BOTTOM}
                fontSize="12"
                fill={Colors.primary}
                textAnchor="middle"
              >
                {gage?.roads[0]?.name}
              </Text>
            </If>
            {/* Area */}
            <If condition={isPathSafe(areaData)}>
              <Path
                d={areaData}
                strokeWidth="0"
                stroke="none"
                fill={Colors.gageChartColor}
                fillOpacity={0.5}
              />
            </If>
            {/* Line */}
            <If condition={isPathSafe(lineData)}>
              <Path
                d={lineData}
                strokeWidth="0.5"
                stroke={Colors.gageChartColor}
              />
            </If>
            {/* Circles */}
            {circleData.map((d, i) => (
              <Circle
                stroke="none"
                fill={Colors.gageChartColor}
                key={d.cx}
                cx={d.cx}
                cy={d.cy}
                r={d.r}
              />
            ))}
          </G>
        </Svg>
      </View>
    )
  }
)

export default GageListItemChart
