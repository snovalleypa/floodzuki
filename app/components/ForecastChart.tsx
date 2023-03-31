import React, { useState } from "react";
import { ActivityIndicator } from "react-native";
import { observer } from "mobx-react-lite";

import HighchartsReactNative from "@services/highcharts/HighchartsReactNative";
import LocalHighchartsReact from "@services/highcharts/LocalHighchartsReact";

import { GageSummary } from "@models/RootStore";
import { Ternary } from "@common-ui/components/Conditional";
import { isMobile } from "@common-ui/utils/responsive";
import { Card } from "@common-ui/components/Card";
import { Spacing } from "@common-ui/constants/spacing";

import useForecastOptions from "@utils/useForecastOptions";
import { Cell } from "@common-ui/components/Common";
import { t } from "@i18n/translate";
import { SegmentControl } from "@common-ui/components/SegmentControl";

interface ForecastChartProps {
  gages: GageSummary[]
}

interface ChartsProps {
  options: Highcharts.Options
}

const RANGES = [
  {
    key: 'DF',
    title: t("forecastChart.fullRangeTitle"),
    before: 3,
    after: 10,
  },
  {
    key: 'D8',
    title: t("forecastChart.rangeDays", { days: 8 }),
    before: 4,
    after: 4,
  },
  {
    key: 'D6',
    title: t("forecastChart.rangeDays", { days: 6 }),
    before: 3,
    after: 3,
  },
  {
    key: 'D4',
    title: t("forecastChart.rangeDays", { days: 4 }),
    before: 2,
    after: 2,
  },
  {
    key: 'D2',
    title: t("forecastChart.rangeDays", { days: 2 }),
    before: 1,
    after: 1,
  },
]

const Charts = (props: ChartsProps) => {
  const { options } = props
  
  return (
    <Ternary condition={isMobile}>
      <HighchartsReactNative
        startInLoadingState
        styles={{ flex: 1 }}
        options={options}
      />
      <LocalHighchartsReact options={options} />
    </Ternary>
  )
}

export const ForecastChart = observer(
  function ForecastChart(props: ForecastChartProps) {
    const { gages } = props

    const [range, setRange] = useState('DF')
    
    const selectedRange = RANGES.find(r => r.key === range)

    const chartOptions = useForecastOptions(gages, selectedRange.before, selectedRange.after)

    return (
      <>
        <SegmentControl
          segments={RANGES}
          selectedSegment={range}
          onChange={setRange}
        />
        <Card
          innerHorizontal={Spacing.extraSmall}
          innerVertical={Spacing.extraSmall}
          height={400}>
          <Ternary condition={!Object.keys(chartOptions).length}>
            <Cell flex>
              <ActivityIndicator />
            </Cell>
            <Charts options={chartOptions}/>
          </Ternary>
        </Card>
      </>
    )
  }
)
