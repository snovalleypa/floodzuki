import React, { useEffect, useRef, useState } from "react"
import { Dayjs } from "dayjs"
import DatePicker from "./DatePicker"
import Icon from "./Icon"
import { Colors } from "@common-ui/constants/colors"
import { RegularText } from "./Text"
import { Pressable, View, ViewStyle } from "react-native"
import { Spacing } from "@common-ui/constants/spacing"
import { Cell } from "./Common"
import localDayJs from "@services/localDayJs"

type DateRangePickerProps = {
  startDate: Dayjs
  endDate: Dayjs
  maxRange?: number // in days
  minYear?: number
  maxYear?: number
  onChange: (startDate: Dayjs, endDate: Dayjs) => void
}

const DateRangePicker = (props: DateRangePickerProps) => {
  const {
    startDate,
    endDate,
    maxRange = 60,
    minYear = 2001,
    maxYear = new Date().getFullYear(),
    onChange,
  } = props

  const startRef = useRef(null)
  const endRef = useRef(null)

  const start = useRef(startDate)
  const end = useRef(endDate)
  const mode = useRef<"start" | "end">("start")

  const [pickedStart, setPickedStart] = useState<boolean>(false)

  const openDateSelector = () => {
    if (mode.current === "start") {
      startRef.current.open()
    } else {
      endRef.current.open()
    }
  }

  const handleStartDateChange = (date: Dayjs) => {
    const today = localDayJs().endOf("day")
    let dateStart = date

    mode.current = "end"
    setPickedStart(true)

    if (date.isAfter(today)) {
      dateStart = today.subtract(1, "day")
    }

    start.current = dateStart
    openDateSelector()
  }

  const handleEndDateChange = (date: Dayjs) => {
    const today = localDayJs().endOf("day")

    let dateEnd = date

    if (date.isAfter(today)) {
      dateEnd = today
    }

    const daysDiff = Math.abs(dateEnd.clone().diff(start.current, "day"))

    mode.current = "end"

    if (daysDiff > maxRange) {
      dateEnd = start.current.clone().add(maxRange, "day")
    }

    end.current = dateEnd

    onChange(start.current, dateEnd)
  }

  return (
    <Pressable style={$viewStyle} onPress={openDateSelector}>
      <Icon name="calendar" color={Colors.darkGrey} size={Spacing.medium} right={Spacing.extraSmall} />
      <DatePicker
        title="Start Date"
        ref={startRef}
        selectedDate={start.current}
        minYear={minYear}
        maxYear={maxYear}
        onChange={handleStartDateChange}
      />
      <Cell left={Spacing.tiny} right={Spacing.tiny}>
        <RegularText>-</RegularText>
      </Cell>
      <DatePicker
        title="End Date"
        ref={endRef}
        selectedDate={end.current}
        minYear={minYear}
        maxYear={maxYear}
        onChange={handleEndDateChange}
      />
    </Pressable>
  )
}

const $viewStyle: ViewStyle = {
  flexDirection: "row",
  borderWidth: 1,
  borderRadius: Spacing.tiny,
  borderColor: Colors.lightGrey,
  paddingVertical: Spacing.extraSmall,
  paddingHorizontal: Spacing.small,
}

export default DateRangePicker
