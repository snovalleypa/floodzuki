import React, { useEffect, useImperativeHandle, useMemo, useRef, useState } from "react"
import { AbsoluteContainer, Cell, Row, Separator } from "./Common"
import { Dayjs } from "dayjs"
import localDayJs from "@services/localDayJs"
import { ScrollView } from "react-native-gesture-handler"
import { SmallTitle, RegularText } from "./Text"
import { Spacing } from "@common-ui/constants/spacing"
import { If, Ternary } from "./Conditional"
import { Pressable, View, ViewStyle, useWindowDimensions } from "react-native"
import { Colors } from "@common-ui/constants/colors"
import { SegmentControl } from "./SegmentControl"
import { Card } from "./Card"
import { useResponsive } from "@common-ui/utils/responsive"
import { BottomSheetModal } from "@gorhom/bottom-sheet"
import { useDatePicker } from "@common-ui/contexts/DatePickerContext"
import { measure, useAnimatedRef } from "react-native-reanimated"
import { useLocale } from "@common-ui/contexts/LocaleContext"

/**
 * A DatePicker component with a calendar and a range support
 */

type DatePickerProps = {
  title?: string
  minYear?: number
  maxYear?: number
  selectedDate: Dayjs
  onChange?: (date: Dayjs) => void
}

type Mode = "day" | "month" | "year"

const PICKER_WIDTH = 300
const PICKER_HEIGHT = 270

const DAYS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, undefined, undefined, undefined, undefined]
const MONTHS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]

const pressableStyle = (state) => ([
  { paddingHorizontal: Spacing.small, paddingVertical: Spacing.extraSmall, borderRadius: Spacing.tiny },
  state.pressed ? { backgroundColor: Colors.lightGrey, opacity: 0.6 } : {},
  state.hovered ? { backgroundColor: Colors.lightestGrey } : {},
])

// organize the days into 5 rows
const daysRows: Array<number[]> = DAYS.reduce((acc, day, index) => {
  const rowIndex = Math.floor(index / 7)
  if (!acc[rowIndex]) {
    acc[rowIndex] = []
  }
  acc[rowIndex].push(day)
  return acc
}, [])

const Days = ({ onSelect }: { onSelect: (day: number) => void }) => {
  return (
    <Cell height={170} flex>
      {daysRows.map((row, index) => (
        <Row flex align="flex-start" key={index}>
          {row.map((day, keyIndex) => (
            <Cell flex align="center" key={`${day}_${keyIndex}`}>
              <Ternary condition={!!day}>
                <Pressable style={pressableStyle} onPress={() => onSelect(day)}>
                  <Cell>
                    <RegularText text={String(day)} />
                  </Cell>
                </Pressable>
                <Cell />
              </Ternary>
            </Cell>
          ))}
        </Row>
      ))}
    </Cell>
  )
}

// organize the months into 4 rows
const monthRows: Array<number[]> = MONTHS.reduce((acc, month, index) => {
  const rowIndex = Math.floor(index / 3)
  if (!acc[rowIndex]) {
    acc[rowIndex] = []
  }
  acc[rowIndex].push(month)
  return acc
}, [])

const Months = ({ onSelect }: { onSelect: (month: number) => void }) => {
  return (
    <Cell flex height={170} innerHorizontal={Spacing.small} innerVertical={Spacing.small}>
      {monthRows.map((row, index) => (
        <Row flex align="flex-start" key={index}>
          {row.map((month) => (
            <Cell flex align="center" key={month}>
              <Pressable style={pressableStyle} onPress={() => onSelect(month)}>
                <RegularText text={localDayJs().month(month).format("MMMM")} />
              </Pressable>
            </Cell>
          ))}
        </Row>
      ))}
    </Cell>
  )
}

const Years = ({ minYear, maxYear, onSelect }: { minYear: number, maxYear: number, onSelect: (year: number) => void }) => {
  // split the years into 4 rows
  const numberOfYears = maxYear - minYear + 1
  const rowsCount = Math.ceil(numberOfYears / 4)
  const offset = rowsCount * 4 - numberOfYears

  const years = useMemo(
    () => Array.from({ length: numberOfYears }, (_, index) =>  minYear + index).reverse(),
    [minYear, numberOfYears]
  )

  const offsetYears = useMemo(
    () => Array.from({ length: offset }, (_, index) =>  undefined),
    [offset]
  )

  const allYears = useMemo(
    () => [...years, ...offsetYears],
    [years, offsetYears]
  )

  const rows: Array<number[]> = useMemo(
    () => allYears.reduce((acc, year, index) => {
      const rowIndex = Math.floor(index / 4)
      if (!acc[rowIndex]) {
        acc[rowIndex] = []
      }
      acc[rowIndex].push(year)
      return acc
    }, []),
    [allYears]
  )

  return (
    <Cell height={170} flex  innerHorizontal={Spacing.small} innerVertical={Spacing.small}>
      <ScrollView style={{ height: 170 }}>
        {rows.map((row, index) => (
          <Row flex align="flex-start" key={index}>
            {row.map((year, keyIndex) => (
              <Cell flex align="center" key={`${year}_${keyIndex}`}>
                <Ternary condition={!!year}>
                  <Pressable style={pressableStyle} onPress={() => onSelect(year)}>
                    <RegularText text={String(year)} />
                  </Pressable>
                  <Cell />
                </Ternary>
              </Cell>
            ))}
          </Row>
        ))}
      </ScrollView>
    </Cell>
  )
}

const DatePicker = (props: DatePickerProps) => {
  const { t } = useLocale()

  const { minYear = 1990, maxYear = localDayJs().year(), selectedDate, title, onChange } = props
  
  const [currentMode, setCurrentMode] = useState<Mode>("day")

  const date = useRef<Dayjs | undefined>(selectedDate.clone())

  const onConfirm = () => {
    if (date.current.isValid()) {
      onChange?.(date.current)
    }
  }

  const onDaySelect = (day: number) => {
    date.current = date.current.date(day)
    setCurrentMode("month")
  }

  const onMonthSelect = (month: number) => {
    date.current = date.current.month(month)
    setCurrentMode("year")
  }

  const onYearSelect = (year: number) => {
    date.current = date.current.year(year)
    setCurrentMode("day")
    onConfirm()
  }

  const modes = useMemo(
    () => [
      { key: "day", title: t("datePicker.day") },
      { key: "month", title: t("datePicker.month") },
      { key: "year", title: t("datePicker.year") },
    ],
    [t]
  )

  return (
    <>
      <If condition={!!title}>
        <Cell align="center">
          <Cell bottom={Spacing.extraSmall}>
            <SmallTitle>{title}</SmallTitle>
          </Cell>
          <Separator />
        </Cell>
      </If>
      <SegmentControl
        bottom={Spacing.zero}
        segments={modes}
        selectedSegment={currentMode}
      />
      <If condition={currentMode === "day"}>
        <Days onSelect={onDaySelect} />
      </If>
      <If condition={currentMode === "month"}>
        <Months onSelect={onMonthSelect} />
      </If>
      <If condition={currentMode === "year"}>
        <Years minYear={minYear} maxYear={maxYear} onSelect={onYearSelect} />
      </If>
    </>
  )
}

const DatePickerComponent = React.forwardRef((props: DatePickerProps, ref) => {
  const { minYear = 1990, maxYear = localDayJs().year(), selectedDate, title, onChange } = props
  const { isMobile } = useResponsive()

  const { width } = useWindowDimensions()

  const pickerRef = useAnimatedRef<View>()
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  const pickerLayout = useRef<{ pageX: number, pageY: number }>({ pageX: 0, pageY: 0 })

  const datePickerContext = useDatePicker()
  const [isOpen, setIsOpen] = useState<boolean>(false)

  const handleChange = (date: Dayjs) => {
    close()
    onChange?.(date)
  }

  useEffect(() => {
    if (isMobile) {
      return
    }
    
    const measured = measure(pickerRef);

    if (measured !== null) {
      const { pageX, pageY } = measured;
      pickerLayout.current = { pageX, pageY }
    }
  }, [])

  const open = () => {
    if (pickerLayout.current) {
      const { pageX, pageY } = pickerLayout.current;

      const offsetLeft = pageX - Spacing.medium
      const leftOffset = offsetLeft + PICKER_WIDTH > width ?
        width - PICKER_WIDTH - Spacing.small :
        offsetLeft

      setIsOpen(true)
      
      isMobile ? 
        bottomSheetModalRef.current?.present() :
        datePickerContext.showPicker(
          <AbsoluteContainer
            sticks={['left']}
            zIndex={10}
            top={pageY + Spacing.larger}
            left={leftOffset}
          >
            <Card width={PICKER_WIDTH} height={PICKER_HEIGHT}>
              <DatePicker
                title={title}
                minYear={minYear}
                maxYear={maxYear}
                selectedDate={selectedDate}
                onChange={handleChange}
              />
            </Card>
          </AbsoluteContainer>
        )
    }
  }

  const close = () => {
    setIsOpen(false)
    
    isMobile ?
      bottomSheetModalRef.current?.dismiss() :
      datePickerContext.hidePicker()
  }

  const toggle = () => {
    if (isOpen) {
      close()
    } else {
      open()
    }
  }

  const isPickerOpen = () => isOpen

  useImperativeHandle(ref, () => ({
    open,
    close,
    toggle,
    isPickerOpen,
  }))

  const formattedDate = selectedDate?.isValid() ? selectedDate?.format("DD/MM/YYYY") : "Select Date"

  return (
    <>
      <View ref={pickerRef}>
        <RegularText text={formattedDate} />
      </View>
      <BottomSheetModal
        index={0}
        ref={bottomSheetModalRef}
        snapPoints={["40%"]}
        style={$bottomSheetStyleMobile}
      >
        <Cell
          flex
          height={170}
          horizontal={Spacing.small}
          top={Spacing.medium}
          bottom={Spacing.extraLarge}
        >
          <DatePicker
            title={title}
            minYear={minYear}
            maxYear={maxYear}
            selectedDate={selectedDate}
            onChange={handleChange}
          />
        </Cell>
      </BottomSheetModal>
    </>
  )
})

const $bottomSheetStyleMobile: ViewStyle = {
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

export default DatePickerComponent
