import React, { useRef } from "react";
import { Platform, Pressable, ViewStyle } from "react-native";
import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import DateTimePicker, {
  DateTimePickerAndroid,
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Dayjs } from "dayjs";
import dayjs from "@services/localDayJs";
import { Colors } from "@common-ui/constants/colors";
import { Spacing } from "@common-ui/constants/spacing";
import { Cell, Row } from "@common-ui/components/Common";
import { RegularText } from "@common-ui/components/Text";
import { SolidButton } from "@common-ui/components/Button";

/**
 * Native-only single-date picker (Platform.OS !== 'web').
 *
 * - iOS: tap the formatted date text to open a BottomSheetModal containing an
 *   inline @react-native-community/datetimepicker. A "Done" button commits the
 *   pending date.
 * - Android: tap the formatted date text to open the OS date-picker dialog
 *   imperatively via DateTimePickerAndroid.open().
 *
 * The component renders only the date text as the visible trigger — no pill
 * chrome (border, icon). That is the parent's responsibility.
 */

export type SingleDatePickerNativeProps = {
  selectedDate: Dayjs;
  minDate: Dayjs;
  maxDate: Dayjs;
  timezone: string;
  onChange: (date: Dayjs) => void;
};

// ---------------------------------------------------------------------------
// Shared helper
// ---------------------------------------------------------------------------
function formatDateTrigger(date: Dayjs, timezone: string): string {
  return date?.isValid() ? date.tz(timezone).format("MM/DD/YYYY") : "Select Date";
}

// ---------------------------------------------------------------------------
// iOS component
// ---------------------------------------------------------------------------
const SingleDatePickerIOS = ({
  selectedDate,
  minDate,
  maxDate,
  timezone,
  onChange,
}: SingleDatePickerNativeProps) => {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  // Track the pending date while the user spins through the inline calendar.
  // We start with the currently-selected date so "Done" without interacting
  // still commits a valid date.
  const pendingDateRef = useRef<Date>(selectedDate.toDate());

  const openSheet = () => {
    // Reset pending date each time the sheet opens
    pendingDateRef.current = selectedDate.toDate();
    bottomSheetModalRef.current?.present();
  };

  const handlePickerChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (date) {
      pendingDateRef.current = date;
    }
  };

  const handleDone = () => {
    bottomSheetModalRef.current?.dismiss();
    const picked = dayjs(pendingDateRef.current).tz(timezone).startOf("day");
    onChange(picked);
  };

  const formattedDate = formatDateTrigger(selectedDate, timezone);

  return (
    <>
      <Pressable onPress={openSheet}>
        <RegularText text={formattedDate} />
      </Pressable>

      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={0}
        enableDynamicSizing
        style={$bottomSheetStyle}>
        <BottomSheetView>
          <Cell horizontal={Spacing.small} top={Spacing.medium} bottom={Spacing.extraLarge}>
            <DateTimePicker
              mode="date"
              display="inline"
              value={selectedDate.toDate()}
              minimumDate={minDate.toDate()}
              maximumDate={maxDate.toDate()}
              onChange={handlePickerChange}
            />
            <Row align="flex-end" top={Spacing.small}>
              <SolidButton title="Done" onPress={handleDone} />
            </Row>
          </Cell>
        </BottomSheetView>
      </BottomSheetModal>
    </>
  );
};

// ---------------------------------------------------------------------------
// Android component
// ---------------------------------------------------------------------------
const SingleDatePickerAndroid = ({
  selectedDate,
  minDate,
  maxDate,
  timezone,
  onChange,
}: SingleDatePickerNativeProps) => {
  const openDialog = () => {
    DateTimePickerAndroid.open({
      value: selectedDate.toDate(),
      minimumDate: minDate.toDate(),
      maximumDate: maxDate.toDate(),
      mode: "date",
      onChange: (event, date) => {
        if (event.type === "set" && date) {
          const picked = dayjs(date).tz(timezone).startOf("day");
          onChange(picked);
        }
      },
    });
  };

  const formattedDate = formatDateTrigger(selectedDate, timezone);

  return (
    <Pressable onPress={openDialog}>
      <RegularText text={formattedDate} />
    </Pressable>
  );
};

// ---------------------------------------------------------------------------
// Exported component — routes to the right platform implementation
// ---------------------------------------------------------------------------
export const SingleDatePickerNative = (props: SingleDatePickerNativeProps) => {
  if (Platform.OS === "ios") {
    return <SingleDatePickerIOS {...props} />;
  }

  return <SingleDatePickerAndroid {...props} />;
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const $bottomSheetStyle: ViewStyle = {
  borderTopLeftRadius: Spacing.small,
  borderTopRightRadius: Spacing.small,
  backgroundColor: Colors.white,
  shadowColor: Colors.midGrey,
  shadowOpacity: 0.3,
  shadowRadius: 10,
  elevation: -8,
  shadowOffset: { width: 0, height: -4 },
};

export default SingleDatePickerNative;
