import React, { useMemo, useRef, useState } from "react";
import { Modal, Platform, Pressable, View, ViewStyle } from "react-native";
import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import DateTimePicker, { DateType, useDefaultStyles } from "react-native-ui-datepicker";
import { Dayjs } from "dayjs";
import localDayJs from "@services/localDayJs";
import { useDatePicker } from "@common-ui/contexts/DatePickerContext";
import Icon from "@common-ui/components/Icon";
import { RegularText } from "@common-ui/components/Text";
import { Cell, Row } from "@common-ui/components/Common";
import { SolidButton, OutlinedButton } from "@common-ui/components/Button";
import { Colors } from "@common-ui/constants/colors";
import { Spacing } from "@common-ui/constants/spacing";

export type DateRangePickerRangeV2Props = {
  startDate: Dayjs;
  endDate: Dayjs;
  minDate?: Dayjs;
  maxDate?: Dayjs;
  timezone: string;
  onChange: (startDate: Dayjs, endDate: Dayjs) => void;
};

type PickerStateV2 = {
  proposedStart: Dayjs | null;
  proposedEnd: Dayjs | null;
};

const isNative = Platform.OS !== "web";

type RangeCalendarSheetProps = {
  pickerState: PickerStateV2;
  resolvedMinDate: Dayjs;
  resolvedMaxDate: Dayjs;
  onPickerChange: (params: { startDate: DateType; endDate: DateType }) => void;
  onSet: () => void;
  onCancel: () => void;
  onClear: () => void;
};

const RangeCalendarSheet = ({
  pickerState,
  resolvedMinDate,
  resolvedMaxDate,
  onPickerChange,
  onSet,
  onCancel,
  onClear,
}: RangeCalendarSheetProps) => {
  const setDisabled = pickerState.proposedStart === null || pickerState.proposedEnd === null;
  const defaultStyles = useDefaultStyles("light");
  const calendarStyles = useMemo(
    () => ({
      ...defaultStyles,
      button_prev_image: { tintColor: Colors.darkGrey },
      button_next_image: { tintColor: Colors.darkGrey },
    }),
    [defaultStyles]
  );

  return (
    <Cell horizontal={Spacing.small} top={Spacing.medium} bottom={Spacing.extraLarge}>
      <DateTimePicker
        mode="range"
        startDate={pickerState.proposedStart?.format("YYYY-MM-DD")}
        endDate={pickerState.proposedEnd?.format("YYYY-MM-DD")}
        minDate={resolvedMinDate.format("YYYY-MM-DD")}
        maxDate={resolvedMaxDate.format("YYYY-MM-DD")}
        showOutsideDays
        onChange={onPickerChange}
        styles={calendarStyles}
      />
      <Row align="center" top={Spacing.small}>
        <Cell flex>
          <OutlinedButton
            title="Cancel"
            onPress={onCancel}
            testID="range-v2-cancel-button"
            fullWidth
          />
        </Cell>
        <Cell flex left={Spacing.small}>
          <OutlinedButton
            title="Clear"
            onPress={onClear}
            testID="range-v2-clear-button"
            fullWidth
          />
        </Cell>
        <Cell flex left={Spacing.small}>
          <SolidButton
            title="Set"
            onPress={onSet}
            disabled={setDisabled}
            testID="range-v2-set-button"
            fullWidth
          />
        </Cell>
      </Row>
    </Cell>
  );
};

export const DateRangePickerRangeV2 = ({
  startDate,
  endDate,
  minDate,
  maxDate,
  timezone,
  onChange,
}: DateRangePickerRangeV2Props) => {
  const { hidePicker } = useDatePicker();
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [webModalVisible, setWebModalVisible] = useState(false);

  const resolvedMinDate = useMemo(
    () => minDate ?? localDayJs.tz("2019-10-01", "YYYY-MM-DD", timezone).startOf("day"),
    [minDate, timezone]
  );
  const resolvedMaxDate = useMemo(
    () => maxDate ?? localDayJs().tz(timezone).endOf("day"),
    [maxDate, timezone]
  );

  const [pickerState, setPickerState] = useState<PickerStateV2>({
    proposedStart: startDate,
    proposedEnd: endDate,
  });

  const handleOpen = () => {
    setPickerState({ proposedStart: startDate, proposedEnd: endDate });

    if (isNative) {
      bottomSheetRef.current?.present();
    } else {
      setWebModalVisible(true);
    }
  };

  // The picker emits endDate at end-of-day in the browser's local TZ (it calls
  // its own getEndOfDay before invoking onChange). We don't want that time
  // component leaking into our state — it survives commit and gets a second
  // endOf("day") applied downstream, which can shift the calendar date forward.
  // Normalize both dates to start-of-day in the gauge timezone, by extracting
  // the calendar date the user actually clicked.
  const toGageDay = (d: Date): Dayjs => {
    const dayString = localDayJs(d).format("YYYY-MM-DD");
    return localDayJs.tz(dayString, "YYYY-MM-DD", timezone).startOf("day");
  };

  const handlePickerChange = ({
    startDate: pickedStart,
    endDate: pickedEnd,
  }: {
    startDate: DateType;
    endDate: DateType;
  }) => {
    const newStart = pickedStart ? toGageDay(pickedStart as Date) : null;
    const newEnd = pickedEnd ? toGageDay(pickedEnd as Date) : null;

    if (!newStart) {
      return;
    }

    setPickerState({ proposedStart: newStart, proposedEnd: newEnd });
  };

  const handleClose = () => {
    if (isNative) {
      bottomSheetRef.current?.dismiss();
    } else {
      setWebModalVisible(false);
      hidePicker();
    }
  };

  const handleClear = () => {
    setPickerState({ proposedStart: null, proposedEnd: null });
  };

  const handleSet = () => {
    if (!pickerState.proposedStart || !pickerState.proposedEnd) {
      return;
    }
    onChange(pickerState.proposedStart, pickerState.proposedEnd);
    handleClose();
  };

  const handleCancel = () => {
    handleClose();
  };

  const formattedStart = startDate.tz(timezone).format("MM/DD/YYYY");
  const formattedEnd = endDate.tz(timezone).format("MM/DD/YYYY");

  const sheetProps: RangeCalendarSheetProps = {
    pickerState,
    resolvedMinDate,
    resolvedMaxDate,
    onPickerChange: handlePickerChange,
    onSet: handleSet,
    onCancel: handleCancel,
    onClear: handleClear,
  };

  return (
    <>
      <Pressable testID="range-v2-trigger" onPress={handleOpen} style={$pillStyle}>
        <Icon
          name="calendar"
          color={Colors.darkGrey}
          size={Spacing.medium}
          right={Spacing.extraSmall}
        />
        <RegularText text={`${formattedStart} – ${formattedEnd}`} numberOfLines={1} />
      </Pressable>

      {isNative && (
        <BottomSheetModal
          ref={bottomSheetRef}
          index={0}
          snapPoints={["80%"]}
          style={$bottomSheetStyle}>
          <BottomSheetView>
            <RangeCalendarSheet {...sheetProps} />
          </BottomSheetView>
        </BottomSheetModal>
      )}

      {!isNative && webModalVisible && (
        <Modal
          visible={webModalVisible}
          transparent
          animationType="fade"
          onRequestClose={handleCancel}>
          <View style={$webOverlayStyle}>
            <View style={$webCardStyle}>
              <RangeCalendarSheet {...sheetProps} />
            </View>
          </View>
        </Modal>
      )}
    </>
  );
};

const $pillStyle: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  borderWidth: 1,
  borderRadius: Spacing.tiny,
  borderColor: Colors.lightGrey,
  paddingVertical: Spacing.extraSmall,
  paddingHorizontal: Spacing.small,
};

const $bottomSheetStyle: ViewStyle = {
  paddingHorizontal: Spacing.medium,
};

const $webOverlayStyle: ViewStyle = {
  flex: 1,
  backgroundColor: "rgba(0,0,0,0.4)",
  justifyContent: "center",
  alignItems: "center",
};

const $webCardStyle: ViewStyle = {
  backgroundColor: Colors.white,
  borderRadius: Spacing.small,
  maxWidth: 360,
  width: "90%",
};

export default DateRangePickerRangeV2;
