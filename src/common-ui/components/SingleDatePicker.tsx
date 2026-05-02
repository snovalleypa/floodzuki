import React, { useEffect, useMemo, useRef, useState } from "react";
import { AbsoluteContainer, Cell, Row } from "./Common";
import { Dayjs } from "dayjs";
import localDayJs from "@services/localDayJs";
import { ScrollView } from "react-native-gesture-handler";
import { RegularText } from "./Text";
import { Spacing } from "@common-ui/constants/spacing";
import { If } from "./Conditional";
import { Platform, Pressable, View, useWindowDimensions } from "react-native";
import { Colors } from "@common-ui/constants/colors";
import { Card } from "./Card";
import { useDatePicker } from "@common-ui/contexts/DatePickerContext";
import { measure, useAnimatedRef } from "react-native-reanimated";

/**
 * A calendar-based single date picker component for web.
 *
 * - On mobile web (coarse pointer): renders a hidden <input type="date"> overlaid on the
 *   trigger text so the OS native date picker fires on tap.
 * - On desktop web: shows a JS popover with a proper month-grid calendar and a year-picker.
 */

export type SingleDatePickerProps = {
  selectedDate: Dayjs;
  minDate: Dayjs;
  maxDate: Dayjs;
  timezone: string;
  onChange: (date: Dayjs) => void;
};

const PICKER_WIDTH = 280;
const PICKER_HEIGHT = 300;

const MIN_YEAR = 2019;

const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

// ---------------------------------------------------------------------------
// Pressable style helper
// ---------------------------------------------------------------------------
const cellPressableStyle = (state: { pressed: boolean; hovered?: boolean }) => [
  {
    paddingHorizontal: Spacing.tiny,
    paddingVertical: Spacing.tiny,
    borderRadius: Spacing.tiny,
    minWidth: 32,
    alignItems: "center" as const,
  },
  state.pressed ? { backgroundColor: Colors.lightGrey, opacity: 0.6 } : {},
  state.hovered ? { backgroundColor: Colors.lightestGrey } : {},
];

// ---------------------------------------------------------------------------
// Calendar grid helpers
// ---------------------------------------------------------------------------
/**
 * Returns a 2-D grid (array of weeks, each week is 7 day-numbers or null).
 * Week starts on Sunday.
 */
function buildCalendarGrid(year: number, month: number): (number | null)[][] {
  const firstDay = localDayJs(new Date(year, month, 1)).day(); // 0=Sun
  const daysInMonth = localDayJs(new Date(year, month, 1)).daysInMonth();

  const cells: (number | null)[] = [];

  // Pad the start with nulls for days before the 1st
  for (let i = 0; i < firstDay; i++) {
    cells.push(null);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(d);
  }

  // Pad end so we have full rows
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Calendar popover content
// ---------------------------------------------------------------------------
type CalendarContentProps = {
  viewYear: number;
  viewMonth: number;
  selectedDate: Dayjs;
  minDate: Dayjs;
  maxDate: Dayjs;
  timezone: string;
  onSelectDay: (day: number) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToggleYearPicker: () => void;
  showYearPicker: boolean;
  onSelectYear: (year: number) => void;
};

const CalendarContent = ({
  viewYear,
  viewMonth,
  selectedDate,
  minDate,
  maxDate,
  timezone,
  onSelectDay,
  onPrevMonth,
  onNextMonth,
  onToggleYearPicker,
  showYearPicker,
  onSelectYear,
}: CalendarContentProps) => {
  const rows = useMemo(() => buildCalendarGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  const headerLabel = localDayJs(new Date(viewYear, viewMonth, 1)).format("MMMM YYYY");

  const selectedDateInTz = selectedDate.tz(timezone);
  const minDateInTz = minDate.tz(timezone);
  const maxDateInTz = maxDate.tz(timezone);

  const isSelected = (day: number) =>
    selectedDateInTz.year() === viewYear &&
    selectedDateInTz.month() === viewMonth &&
    selectedDateInTz.date() === day;

  const isDisabled = (day: number) => {
    const d = localDayJs.tz(
      `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      timezone
    );
    return d.isBefore(minDateInTz, "day") || d.isAfter(maxDateInTz, "day");
  };

  const maxYear = localDayJs().year();
  const years = useMemo(() => {
    const arr: number[] = [];
    for (let y = maxYear; y >= MIN_YEAR; y--) {
      arr.push(y);
    }
    return arr;
  }, [maxYear]);

  const yearRows: number[][] = useMemo(() => {
    const rows: number[][] = [];
    for (let i = 0; i < years.length; i += 4) {
      rows.push(years.slice(i, i + 4));
    }
    return rows;
  }, [years]);

  return (
    <Cell innerHorizontal={Spacing.extraSmall} innerVertical={Spacing.extraSmall}>
      {/* Header row */}
      <Row align="space-between" justify="center" bottom={Spacing.extraSmall}>
        <Pressable style={cellPressableStyle} onPress={onPrevMonth}>
          <RegularText text="<" />
        </Pressable>

        <Pressable style={cellPressableStyle} onPress={onToggleYearPicker}>
          <RegularText text={headerLabel} />
        </Pressable>

        <Pressable style={cellPressableStyle} onPress={onNextMonth}>
          <RegularText text=">" />
        </Pressable>
      </Row>

      <If condition={showYearPicker}>
        {/* Year picker grid */}
        <Cell height={220}>
          <ScrollView style={{ height: 220 }}>
            {yearRows.map((row, rowIdx) => (
              <Row flex align="space-around" key={rowIdx} bottom={Spacing.tiny}>
                {row.map((year) => (
                  <Cell flex align="center" key={year}>
                    <Pressable
                      style={(state) => [
                        ...cellPressableStyle(state),
                        year === viewYear
                          ? {
                              backgroundColor: Colors.primary,
                            }
                          : {},
                      ]}
                      onPress={() => onSelectYear(year)}>
                      <RegularText
                        text={String(year)}
                        color={year === viewYear ? Colors.white : undefined}
                      />
                    </Pressable>
                  </Cell>
                ))}
              </Row>
            ))}
          </ScrollView>
        </Cell>
      </If>

      <If condition={!showYearPicker}>
        {/* Month calendar grid */}
        <Cell>
          {/* Day-of-week labels */}
          <Row align="space-around" bottom={Spacing.tiny}>
            {DAY_LABELS.map((label) => (
              <Cell flex align="center" key={label}>
                <RegularText text={label} color={Colors.darkGrey} />
              </Cell>
            ))}
          </Row>

          {/* Calendar day rows */}
          {rows.map((row, rowIdx) => (
            <Row align="space-around" key={rowIdx} bottom={Spacing.tiny}>
              {row.map((day, colIdx) => (
                <Cell flex align="center" key={`${rowIdx}-${colIdx}`}>
                  {day !== null ? (
                    <Pressable
                      disabled={isDisabled(day)}
                      style={(state) => [
                        ...cellPressableStyle(state),
                        isSelected(day)
                          ? {
                              backgroundColor: Colors.primary,
                            }
                          : {},
                      ]}
                      onPress={() => onSelectDay(day)}>
                      <RegularText
                        text={String(day)}
                        color={
                          isSelected(day)
                            ? Colors.white
                            : isDisabled(day)
                            ? Colors.darkGrey
                            : undefined
                        }
                      />
                    </Pressable>
                  ) : (
                    <Cell />
                  )}
                </Cell>
              ))}
            </Row>
          ))}
        </Cell>
      </If>
    </Cell>
  );
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export const SingleDatePicker = ({
  selectedDate,
  minDate,
  maxDate,
  timezone,
  onChange,
}: SingleDatePickerProps) => {
  const { width } = useWindowDimensions();
  const datePickerContext = useDatePicker();

  const pickerRef = useAnimatedRef<View>();
  const pickerLayout = useRef<{ pageX: number; pageY: number }>({ pageX: 0, pageY: 0 });

  const [isOpen, setIsOpen] = useState(false);
  const [isCoarsePointer, setIsCoarsePointer] = useState(false);

  // Calendar navigation state
  const dateInTz = selectedDate.tz(timezone);
  const [viewYear, setViewYear] = useState(dateInTz.year());
  const [viewMonth, setViewMonth] = useState(dateInTz.month());
  const [showYearPicker, setShowYearPicker] = useState(false);

  // Detect coarse pointer (mobile web) once on mount
  useEffect(() => {
    if (Platform.OS !== "web") {
      return;
    }
    const mq = window.matchMedia("(pointer: coarse)");
    setIsCoarsePointer(mq.matches);
  }, []);

  // Keep calendar view in sync with external selectedDate changes
  useEffect(() => {
    const d = selectedDate.tz(timezone);
    setViewYear(d.year());
    setViewMonth(d.month());
  }, [selectedDate, timezone]);

  // Sync local isOpen when the picker is dismissed externally
  useEffect(() => {
    if (!datePickerContext.isVisible) {
      setIsOpen(false);
    }
  }, [datePickerContext.isVisible]);

  // Measure trigger position once on mount (desktop web only)
  useEffect(() => {
    if (Platform.OS !== "web" || isCoarsePointer) {
      return;
    }
    const measured = measure(pickerRef);
    if (measured !== null) {
      const { pageX, pageY } = measured;
      pickerLayout.current = { pageX, pageY };
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleNativeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; // "YYYY-MM-DD"
    if (!val) {
      return;
    }
    const parsed = localDayJs.tz(val, "YYYY-MM-DD", timezone).startOf("day");
    if (parsed.isValid()) {
      onChange(parsed);
    }
  };

  const handleSelectDay = (day: number) => {
    const picked = localDayJs
      .tz(
        `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
        timezone
      )
      .startOf("day");
    onChange(picked);
    close();
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleToggleYearPicker = () => {
    setShowYearPicker((v) => !v);
  };

  const handleSelectYear = (year: number) => {
    setViewYear(year);
    setShowYearPicker(false);
  };

  const open = () => {
    const { pageX, pageY } = pickerLayout.current;
    const offsetLeft = pageX - Spacing.medium;
    const leftOffset =
      width < 768
        ? (width - PICKER_WIDTH) / 2
        : offsetLeft + PICKER_WIDTH > width
        ? width - PICKER_WIDTH - Spacing.small
        : offsetLeft;

    setIsOpen(true);
    datePickerContext.showPicker(
      <AbsoluteContainer
        sticks={["left"]}
        zIndex={10}
        top={pageY + Spacing.larger}
        left={leftOffset}>
        <Card width={PICKER_WIDTH} height={PICKER_HEIGHT} noPadding>
          <CalendarContent
            viewYear={viewYear}
            viewMonth={viewMonth}
            selectedDate={selectedDate}
            minDate={minDate}
            maxDate={maxDate}
            timezone={timezone}
            onSelectDay={handleSelectDay}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onToggleYearPicker={handleToggleYearPicker}
            showYearPicker={showYearPicker}
            onSelectYear={handleSelectYear}
          />
        </Card>
      </AbsoluteContainer>
    );
  };

  const close = () => {
    setIsOpen(false);
    datePickerContext.hidePicker();
  };

  const toggle = () => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  const formattedDate = selectedDate?.isValid()
    ? selectedDate.tz(timezone).format("MM/DD/YYYY")
    : "Select Date";

  // Mobile web: overlay a hidden <input type="date"> over the trigger text
  if (isCoarsePointer) {
    return (
      <View style={{ position: "relative" }}>
        <RegularText text={formattedDate} />
        {/* @ts-ignore — raw HTML <input> works in React Native Web */}
        <input
          type="date"
          value={selectedDate.tz(timezone).format("YYYY-MM-DD")}
          min={minDate.tz(timezone).format("YYYY-MM-DD")}
          max={maxDate.tz(timezone).format("YYYY-MM-DD")}
          onChange={handleNativeInputChange}
          style={{
            position: "absolute",
            opacity: 0,
            width: "100%",
            height: "100%",
            top: 0,
            left: 0,
            cursor: "pointer",
          }}
        />
      </View>
    );
  }

  // Desktop web: JS calendar popover
  return (
    <Pressable onPress={toggle}>
      <View ref={pickerRef}>
        <RegularText text={formattedDate} />
      </View>
    </Pressable>
  );
};

export default SingleDatePicker;
