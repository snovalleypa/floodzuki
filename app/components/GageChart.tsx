import React from "react";
import { observer } from "mobx-react-lite";

import HighchartsReactNative from "@services/highcharts/HighchartsReactNative";
import LocalHighchartsReact from "@services/highcharts/LocalHighchartsReact";

import { Ternary } from "@common-ui/components/Conditional";
import { isMobile } from "@common-ui/utils/responsive";
import { Spacing } from "@common-ui/constants/spacing";

import { Cell } from "@common-ui/components/Common";
import { Gage, GageChartDataType } from "@models/Gage";
import useGageChartOptions from "@utils/useGageChartOptions";

interface GageChartProps {
  gage: Gage
  optionType: 'dashboardOptions' | 'gageDetailsOptions'
}

interface ChartsProps {
  options: Highcharts.Options
}

const Charts = (props: ChartsProps) => {
  const { options } = props
  
  return (
    <Ternary condition={isMobile}>
      <HighchartsReactNative
        startInLoadingState={false}
        styles={{ flex: 1 }}
        options={options}
        modules={['broken-axis']}
      />
      <LocalHighchartsReact options={options} />
    </Ternary>
  )
}

export const GageChart = observer(
  function GageChart(props: GageChartProps) {
    const { gage, optionType } = props

    const [chartOptions] = useGageChartOptions(gage, optionType, GageChartDataType.LEVEL)

    return (
      <Cell flex innerHorizontal={Spacing.tiny} innerVertical={Spacing.tiny}>
        <Ternary condition={!!Object.keys(chartOptions).length}>
          <Charts options={chartOptions}/>
          <></>
        </Ternary>
      </Cell>
    )
  }
)
