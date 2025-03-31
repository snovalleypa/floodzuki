import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, TextStyle, TouchableOpacity, View, ViewStyle } from "react-native";
import { observer } from "mobx-react-lite";
import { useLocalSearchParams, useRouter } from "expo-router"

import LocalHighchartsReact from "@services/highcharts/LocalHighchartsReact";

import { Gage, GageChartDataType } from "@models/Gage";
import { If, Ternary } from "@common-ui/components/Conditional";
import { isAndroid, isIOS, isMobile, useResponsive } from "@common-ui/utils/responsive";
import { Card, CardFooter, CardHeader } from "@common-ui/components/Card";
import { Spacing } from "@common-ui/constants/spacing";

import { Cell, Row } from "@common-ui/components/Common";
import { SegmentControl } from "@common-ui/components/SegmentControl";
import useGageChartOptions from "@utils/useGageChartOptions";
import useChartRange from "@utils/useChartRange";
import localDayJs from "@services/localDayJs";
import { useStores } from "@models/helpers/useStores";
import { useInterval } from "@utils/useTimeout";
import Config from "@config/config";
import { IconButton, SolidButton } from "@common-ui/components/Button";
import { Colors } from "@common-ui/constants/colors";
import { Picker } from "@react-native-picker/picker";
import { LabelText, MediumText, RegularText, SmallerText } from "@common-ui/components/Text";
import { FloodEvent } from "@models/LocationInfo";
import { DataPoint } from "@models/Forecasts";
import { formatReadingTime } from "@utils/useTimeFormat";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import Icon from "@common-ui/components/Icon";
import DateRangePicker from "@common-ui/components/DateRangePicker";
import { Dayjs } from "dayjs";
import { normalizeSearchParams } from "@utils/navigation";
import { useLocale } from "@common-ui/contexts/LocaleContext";
import { GageDetailsChartNative } from "./GageDetailsChartNative";

interface GageDetailsChartProps {
  gage: Gage
  hideChart?: boolean
}

interface ChartsProps {
  options: Highcharts.Options
}

// Ranges available for selection
const RANGES = (t) => [
  {
    key: "14",
    title: t("forecastChart.rangeDays", { days: 14 }),
  },
  {
    key: "7",
    title: t("forecastChart.rangeDays", { days: 7 }),
  },
  {
    key: "2",
    title: t("forecastChart.rangeDays", { days: 2 }),
  },
  {
    key: "1",
    title: `1 ${t("forecastChart.rangeDay")}`,
  },
]

// Possible chart data types
const CHART_DATA_TYPES = (t) => [
  {
    key: GageChartDataType.LEVEL,
    title: t("gageDetailsChart.waterLevel")
  },
  {
    key: GageChartDataType.DISCHARGE,
    title: t("gageDetailsChart.discharge")
  }
]

const SELECT_EVENT = "gageDetailsChart._selectEvent"

const Charts = (props: ChartsProps) => {
  const { options } = props
  
  return (
    <Cell height={320}>
      <Ternary condition={isMobile}>
        <GageDetailsChartNative options={options} />
        <LocalHighchartsReact options={options} />
      </Ternary>
    </Cell>
  )
}

const PickerSelector = ({
  floodEvents = [],
  historicEventId,
  onHistoricEventSelected
}: {
  floodEvents: FloodEvent[];
  historicEventId?: string | string[];
  onHistoricEventSelected: (historicEventId: string) => void
}) => {
  const { t } = useLocale()
  const eventId = Array.isArray(historicEventId) ? historicEventId[0] : historicEventId

  const width = isAndroid ? { width: 200 } : {}

  return (
    <Picker
      prompt={t("gageDetailsChart.selectEvent")}
      selectedValue={eventId}
      onValueChange={onHistoricEventSelected}
      style={[$pickerStyle, width]}
    >
      <Picker.Item label={t(SELECT_EVENT)} value={SELECT_EVENT} />
      {floodEvents?.map((event, index) => (
        <Picker.Item key={event.id} label={event.eventName} value={event.id} />
      ))}
    </Picker>
  )
}

/** Historic Flooding events picker */
const HistoricEvents = observer(
  function HistoricEvents({ floodEvents = [] }: { floodEvents: FloodEvent[] }) {
    const router = useRouter()
    const { t } = useLocale()
    const { historicEventId } = useLocalSearchParams()
    const bottomSheetModalRef = useRef<BottomSheetModal>(null);

    const [selectedEvent, setSelectedEvent] = useState<string | undefined>()

    // Update chart when historic event selected
    const onHistoricEventSelected = (historicEventId: string) => {
      // Clear params when no event selected
      if (!historicEventId)  return

      if (historicEventId === SELECT_EVENT) {
        router.setParams({
          historicEventId: undefined,
          from: undefined,
          to: undefined
        })
        return
      }

      const historicEventIdNum = parseInt(historicEventId)
      const event = floodEvents.find(e => e.id === historicEventIdNum)

      if (!event) return

      router.setParams({
        historicEventId,
        from: localDayJs.tz(event.fromDate).format("YYYY-MM-DD"),
        to: localDayJs.tz(event.toDate).format("YYYY-MM-DD")
      })

      bottomSheetModalRef.current?.dismiss()
    }

    const openModal = () => {
      bottomSheetModalRef.current?.present()
    }

    const historicEventIdNum = Array.isArray(historicEventId) ? parseInt(historicEventId[0]) : parseInt(historicEventId)
    const title = floodEvents.find(e => e.id === historicEventIdNum)?.eventName ?? t("gageDetailsChart.selectEvent")

    return (
      <If condition={!!floodEvents.length}>
        <Row>
          <RegularText muted>{t("gageDetailsChart.historicalEvents")}:  </RegularText>
          <Ternary condition={isIOS}>
            <>
              <TouchableOpacity onPress={openModal}>
                <View style={$pickerSelectorStyle}>
                  <RegularText muted>{title}</RegularText>
                  <Icon left={Spacing.tiny} name="chevron-down" color={Colors.darkGrey} />
                </View>
              </TouchableOpacity>
              <BottomSheetModal
                index={0}
                detached={true}
                ref={bottomSheetModalRef}
                snapPoints={["40%"]}
                style={$bottomSheetStyle}
              >
                <PickerSelector
                  historicEventId={selectedEvent ?? historicEventId}
                  floodEvents={floodEvents}
                  onHistoricEventSelected={setSelectedEvent}
                />
                <Cell horizontal={Spacing.large}>
                  <SolidButton
                    fullWidth
                    title={t("common.confirm")}
                    onPress={() => onHistoricEventSelected(selectedEvent)}
                  />
                </Cell>
              </BottomSheetModal>
            </>
            <PickerSelector
              historicEventId={historicEventId}
              floodEvents={floodEvents}
              onHistoricEventSelected={onHistoricEventSelected}
            />
          </Ternary>
        </Row>
      </If>
    )
  }
)

/** Water level rate of change */
const RateOfChange = observer(
  function RateOfChange({ gage }: { gage: Gage }) {
    const { t } = useLocale()

    // set rate of change
    let rate = gage?.predictedFeetPerHour
    if (rate > -0.01 && rate < 0.01) {
      rate = null;
    }

    const crossingTime = useMemo(() => {
      let crossingTime = null;

      if (!gage?.roadSaddleHeight) return null;
      
      for (var i = 0; i < gage.predictions?.length - 1; i++) {
        let p = gage.predictions[i];
        let pNext = gage.predictions[i + 1];
        
        if (pNext.waterHeight === gage.roadSaddleHeight) {
          crossingTime = localDayJs.tz(pNext.timestamp);
          break;
        }
        
        if ((pNext.waterHeight > gage.roadSaddleHeight && gage.roadSaddleHeight > p.waterHeight) ||
            (pNext.waterHeight < gage.roadSaddleHeight && gage.roadSaddleHeight < p.waterHeight)) {
          let waterDelta = (gage.roadSaddleHeight - p.waterHeight) / (pNext.waterHeight - p.waterHeight);
          let msec = localDayJs.tz(pNext.timestamp).diff(localDayJs.tz(p.timestamp)) * waterDelta;
          crossingTime = localDayJs.tz(p.timestamp).add(msec, 'milliseconds');
          break;
        }
      }

      return crossingTime;
    }, [gage?.locationId, gage?.roadSaddleHeight]);

    if (!gage?.locationId) return null;

    if (!rate) return null

    const rateText = `${rate > 0 ? "+" : ""}${rate.toFixed(2)} ${t("measure.feet")}/${t("measure.hour")}`

    return (
      <Row align="center" bottom={Spacing.extraSmall}>
        <MediumText muted>{t("gageDetailsChart.rateOfChange")}: </MediumText>
        <RegularText muted>{rateText}</RegularText>
        <If condition={!!crossingTime}>
          <LabelText>
            {" "}{t("gageDetailsChart.roadLevel")} @{" "}
            <SmallerText>{crossingTime?.format("llll")}</SmallerText>
          </LabelText>
        </If>
      </Row>
    )
  }
)

/** Crest Info */
const CrestInfo = observer(
  function CrestInfo({ crest }: { crest: DataPoint }) {
    const { t } = useLocale()

    if (!crest) return null
    
    return (
      <Row align="center" bottom={Spacing.extraSmall}>
        <MediumText muted>{t("measure.max")}: </MediumText>
        <RegularText muted>
          {crest?.reading?.toFixed(2)} {t("measure.ft")}. / {formatReadingTime(crest?.timestamp)}
        </RegularText>
      </Row>
    )
  }
)

export const GageDetailsChart = observer(
  function GageDetailsChart(props: GageDetailsChartProps) {
    const { gage, hideChart } = props
    
    const router = useRouter()
    const { t } = useLocale()
    const { from, to } = useLocalSearchParams()
    const { gagesStore, isDataFetched } = useStores();

    const { isMobile } = useResponsive()
    
    const chartRange = useChartRange(normalizeSearchParams(from), normalizeSearchParams(to))

    const [rangeOption, setRangeOption] = useState("2")
    const [chartDataType, setChartDataType] = useState<GageChartDataType>(GageChartDataType.LEVEL)
    const [range, setRange] = useState({
      chartStartDate: chartRange.chartStartDate,
      chartEndDate: chartRange.chartEndDate
    })

    // Fetch data periodically
    useInterval(() => {
      chartRange.isNow ?
        gagesStore.fetchDataForGage(
          gage?.locationId,
          range.chartStartDate.utc().format(),
          range.chartEndDate.utc().format(),
          chartRange.isNow,
          true,
        ) :
        null
    }, gage?.locationId && isDataFetched && chartRange.isNow ? Config.LIVE_CHART_DATA_REFRESH_INTERVAL : null)

    // Fetch data on mount but first wait for main data to be fetched
    useEffect(() => {
      if (gage?.locationId && isDataFetched) {
        gagesStore.fetchDataForGage(
          gage?.locationId,
          chartRange.chartStartDate.utc().format(),
          chartRange.chartEndDate.utc().format(),
          chartRange.isNow,
          false,
        )
      }
    }, [gage?.locationId, isDataFetched])

    const refetchData = () => {
      refreshData()
    }

    const refreshData = (from?: string, to?: string) => {
      gagesStore.fetchDataForGage(
        gage?.locationId,
        from ?? range.chartStartDate.utc().format(),
        to ?? range.chartEndDate.utc().format(),
        chartRange.isNow,
        !from && chartRange.isNow,
      )
    }

    const onRangeChange = (key: string) => {
      chartRange.changeDays(parseInt(key))
      
      setRange({
        chartStartDate: chartRange.chartStartDate,
        chartEndDate: chartRange.chartEndDate
      })
      
      setRangeOption(key)
      refreshData(
        chartRange.chartStartDate.utc().format(),
        chartRange.chartEndDate.utc().format()
      )
    }

    const onDateRangeChange = (from: Dayjs, to: Dayjs) => {
      router.setParams({
        historicEventId: undefined,
        from: from.format("YYYY-MM-DD"),
        to: to.format("YYYY-MM-DD")
      })
    }

    const onChartDataTypeChange = (key: GageChartDataType) => {
      setChartDataType(key)
    }
    
    const [chartOptions, crest] = useGageChartOptions(
      gage,
      "gageDetailsOptions",
      chartDataType,
      range
    )

    const hasDischargeControl = gage?.locationInfo?.hasDischarge && !Config.GAGES_WITHOUT_DISHCARGE.includes(gage?.locationId)

    return (
      <Card
        innerHorizontal={Spacing.extraSmall}
        innerVertical={Spacing.extraSmall}>
        <CardHeader
          horizontal={-Spacing.extraSmall}>
          <If condition={hasDischargeControl}>
            <SegmentControl
              bottom={Spacing.small}
              segments={CHART_DATA_TYPES(t)}
              selectedSegment={chartDataType}
              onChange={onChartDataTypeChange}
            />
          </If>
          <Row align="space-between">
            <Cell flex />
            <Cell flex>
              <SegmentControl
                bottom={Spacing.zero}
                segments={RANGES(t)}
                selectedSegment={rangeOption}
                onChange={onRangeChange}
                />
              <If condition={isMobile}>
                <Cell flex align="center" top={Spacing.tiny}>
                  <DateRangePicker
                    startDate={range.chartStartDate}
                    endDate={range.chartEndDate}
                    onChange={onDateRangeChange}
                  />
                </Cell>
              </If>
            </Cell>
            <Cell flex align="flex-end">
              <If condition={!isMobile}>
                <DateRangePicker
                  startDate={range.chartStartDate}
                  endDate={range.chartEndDate}
                  onChange={onDateRangeChange}
                />
              </If>
            </Cell>
          </Row>
        </CardHeader>
        <Ternary condition={!Object.keys(chartOptions).length || hideChart}>
          <Cell height={320} flex>
            <ActivityIndicator animating />
          </Cell>
          <Charts options={chartOptions} />
        </Ternary>
        <CardFooter horizontal={-Spacing.extraSmall}>
          <Row align="space-between">
            <Cell />
            <Cell>
              <CrestInfo crest={crest} />
              <RateOfChange gage={gage} />
              <HistoricEvents floodEvents={gage?.locationInfo?.floodEvents} />
            </Cell>
            {/* Refresh Icon */}
            <Ternary condition={isMobile}>
              <Cell />
              <Ternary condition={gagesStore.isFetching}>
                <Cell
                  width={Spacing.larger}
                  height={Spacing.larger}
                  align="center"
                >
                  <ActivityIndicator animating />
                </Cell>
                <IconButton
                  small
                  icon="rotate-cw"
                  iconSize={Spacing.large}
                  onPress={refetchData}
                  textColor={Colors.midGrey}
                />
              </Ternary>
            </Ternary>
          </Row>
        </CardFooter>
      </Card>
    )
  }
)

const $pickerStyle: TextStyle = {
  paddingVertical: Spacing.tiny,
  paddingHorizontal: Spacing.small,
  borderColor: Colors.lightGrey,
  color: Colors.lightDark,
  borderRadius: Spacing.tiny,
}

const $pickerSelectorStyle: ViewStyle = {
  paddingVertical: Spacing.tiny,
  paddingLeft: Spacing.small,
  paddingRight: Spacing.tiny,
  borderColor: Colors.lightGrey,
  borderWidth: 1,
  borderRadius: Spacing.tiny,
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center"
}

const $bottomSheetStyle: ViewStyle = {
  borderTopLeftRadius: Spacing.small,
  borderTopRightRadius: Spacing.small,
  backgroundColor: Colors.white,
  shadowColor: Colors.midGrey,
  shadowOpacity: 0.3,
  shadowRadius: 10,
  elevation: -8,
  shadowOffset: {
    width: 0,
    height: -4,
  },
}
