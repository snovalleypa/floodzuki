import React, { useEffect, useRef, useState } from "react";
import { Dayjs } from "dayjs";
import DatePicker from "./DatePicker";
import Icon from "./Icon";
import { Colors } from "@common-ui/constants/colors";
import { RegularText } from "./Text";
import { Pressable, View, ViewStyle } from "react-native";
import { Spacing } from "@common-ui/constants/spacing";
import { Cell } from "./Common";
import localDayJs from "@services/localDayJs";
import { useLocale } from "@common-ui/contexts/LocaleContext";

type DateRangePickerProps = {
  startDate: Dayjs;
  endDate: Dayjs;
  maxRange?: number; // in days
  minYear?: number;
  maxYear?: number;
  onChange: (startDate: Dayjs, endDate: Dayjs) => void;
};

const DateRangePicker = (props: DateRangePickerProps) => {
  const {
    startDate,
    endDate,
    maxRange = 90,
    minYear = 2001,
    maxYear = new Date().getFullYear(),
    onChange,
  } = props;

  const { t } = useLocale();

  const startRef = useRef(null);
  const endRef = useRef(null);

  const [start, setStart] = useState<Dayjs>(startDate);
  const [end, setEnd] = useState<Dayjs>(endDate);
  const mode = useRef<"start" | "end">("start");

  useEffect(() => {
    setStart(startDate);
  }, [startDate.valueOf()]);

  useEffect(() => {
    setEnd(endDate);
  }, [endDate.valueOf()]);

  const [pickedStart, setPickedStart] = useState<boolean>(false);

  const openDateSelector = () => {
    if (mode.current === "start") {
      if (startRef.current?.isPickerOpen()) {
        startRef.current?.close();
      } else {
        startRef.current?.open();
      }
    } else {
      if (endRef.current?.isPickerOpen()) {
        endRef.current?.close();
      } else {
        endRef.current?.open();
      }
    }
  };

  const handleStartDateChange = (date: Dayjs) => {
    const today = localDayJs().endOf("day");
    let dateStart = date;

    mode.current = "end";
    setPickedStart(true);

    if (date.isAfter(today)) {
      dateStart = today.subtract(1, "day");
    }

    setStart(dateStart);
    openDateSelector();
  };

  const handleEndDateChange = (date: Dayjs) => {
    const today = localDayJs().endOf("day");

    let dateEnd = date;

    if (date.isAfter(today)) {
      dateEnd = today;
    }

    const daysDiff = Math.abs(dateEnd.clone().diff(start, "day"));

    mode.current = "start";

    if (daysDiff > maxRange) {
      dateEnd = start.clone().add(maxRange, "day");
    }

    setEnd(dateEnd);

    onChange(start, dateEnd);
  };

  return (
    <Pressable style={$viewStyle} onPress={openDateSelector}>
      <Icon
        name="calendar"
        color={Colors.darkGrey}
        size={Spacing.medium}
        right={Spacing.extraSmall}
      />
      <DatePicker
        title={t("datePicker.startDate")}
        ref={startRef}
        selectedDate={start}
        minYear={minYear}
        maxYear={maxYear}
        onChange={handleStartDateChange}
      />
      <Cell left={Spacing.tiny} right={Spacing.tiny}>
        <RegularText>-</RegularText>
      </Cell>
      <DatePicker
        title={t("datePicker.endDate")}
        ref={endRef}
        selectedDate={end}
        minYear={minYear}
        maxYear={maxYear}
        onChange={handleEndDateChange}
      />
    </Pressable>
  );
};

const $viewStyle: ViewStyle = {
  flexDirection: "row",
  borderWidth: 1,
  borderRadius: Spacing.tiny,
  borderColor: Colors.lightGrey,
  paddingVertical: Spacing.extraSmall,
  paddingHorizontal: Spacing.small,
};

export default DateRangePicker;
