import React, { useMemo, useRef, useState } from "react";
import { Modal, Platform, Pressable, View, ViewStyle } from "react-native";
import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import DateTimePicker, { DateType, useDefaultStyles } from "react-native-ui-datepicker";
import { Dayjs } from "dayjs";
import localDayJs from "@services/localDayJs";
import {
  applyFirstTap,
  applySecondTap,
  FirstTapResult,
} from "@common-ui/utils/applyRangeRulesRangeV1";
import { useDatePicker } from "@common-ui/contexts/DatePickerContext";
import Icon from "@common-ui/components/Icon";
import { RegularText } from "@common-ui/components/Text";
import { Cell, Row } from "@common-ui/components/Common";
import { SolidButton, OutlinedButton } from "@common-ui/components/Button";
import { Colors } from "@common-ui/constants/colors";
import { Spacing } from "@common-ui/constants/spacing";

export type DateRangePickerRangeV1Props = {
  startDate: Dayjs;
  endDate: Dayjs;
  maxRange?: number;
  minDate?: Dayjs;
  maxDate?: Dayjs;
  timezone: string;
  onChange: (startDate: Dayjs, endDate: Dayjs) => void;
  onRangeRestricted?: () => void;
};

type PickerState = {
  selectionPhase: "idle" | "awaitingEnd";
  tentativeStart: Dayjs | null;
  proposedStart: Dayjs;
  proposedEnd: Dayjs | null;
  dynamicMaxDate: Dayjs | null;
};

const isNative = Platform.OS !== "web";

// ---------------------------------------------------------------------------
// Calendar content (shared across all modal surfaces)
// ---------------------------------------------------------------------------
type RangeCalendarSheetProps = {
  pickerState: PickerState;
  resolvedMinDate: Dayjs;
  effectiveMaxDate: Dayjs;
  onPickerChange: (params: { startDate: DateType; endDate: DateType }) => void;
  onSet: () => void;
  onCancel: () => void;
};

const RangeCalendarSheet = ({
  pickerState,
  resolvedMinDate,
  effectiveMaxDate,
  onPickerChange,
  onSet,
  onCancel,
}: RangeCalendarSheetProps) => {
  const setDisabled = pickerState.proposedEnd === null;
  const defaultStyles = useDefaultStyles();

  return (
    <Cell horizontal={Spacing.small} top={Spacing.medium} bottom={Spacing.extraLarge}>
      <DateTimePicker
        mode="range"
        startDate={pickerState.proposedStart.format("YYYY-MM-DD")}
        endDate={pickerState.proposedEnd?.format("YYYY-MM-DD")}
        minDate={resolvedMinDate.format("YYYY-MM-DD")}
        maxDate={effectiveMaxDate.format("YYYY-MM-DD")}
        onChange={onPickerChange}
        styles={defaultStyles}
      />
      <Row align="center" top={Spacing.small}>
        <OutlinedButton title="Cancel" onPress={onCancel} testID="range-v1-cancel-button" />
        <Cell left={Spacing.small}>
          <SolidButton
            title="Set"
            onPress={onSet}
            disabled={setDisabled}
            testID="range-v1-set-button"
          />
        </Cell>
      </Row>
    </Cell>
  );
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export const DateRangePickerRangeV1 = ({
  startDate,
  endDate,
  maxRange = 30,
  minDate,
  maxDate,
  timezone,
  onChange,
}: DateRangePickerRangeV1Props) => {
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

  // Classification anchor: set on open, then re-anchored after every completed proposed range.
  // Do NOT derive from props mid-session — props only reflect the committed chart range.
  const capturedPrevRef = useRef({ prevStart: startDate, prevEnd: endDate, prevSpanDays: 0 });

  const [pickerState, setPickerState] = useState<PickerState>({
    selectionPhase: "idle",
    tentativeStart: null,
    proposedStart: startDate,
    proposedEnd: endDate,
    dynamicMaxDate: null,
  });

  const effectiveMaxDate = (() => {
    if (!pickerState.dynamicMaxDate) {
      return resolvedMaxDate;
    }
    return pickerState.dynamicMaxDate.isBefore(resolvedMaxDate)
      ? pickerState.dynamicMaxDate
      : resolvedMaxDate;
  })();

  const handleOpen = () => {
    const prevStart = startDate;
    const prevEnd = endDate;
    const prevSpanDays = Math.min(prevEnd.diff(prevStart, "day"), maxRange);
    capturedPrevRef.current = { prevStart, prevEnd, prevSpanDays };

    setPickerState({
      selectionPhase: "idle",
      tentativeStart: null,
      proposedStart: prevStart,
      proposedEnd: prevEnd,
      dynamicMaxDate: null,
    });

    if (isNative) {
      bottomSheetRef.current?.present();
    } else {
      setWebModalVisible(true);
    }
  };

  const handlePickerChange = ({
    startDate: pickedStart,
    endDate: pickedEnd,
  }: {
    startDate: DateType;
    endDate: DateType;
  }) => {
    const newStart = pickedStart ? localDayJs(pickedStart as Date).tz(timezone) : null;
    const newEnd = pickedEnd ? localDayJs(pickedEnd as Date).tz(timezone) : null;

    // Awaiting-end branch: completing a Case 2a selection. The library returns a properly
    // ordered { startDate, endDate } pair on the second tap; trust its ordering rather than
    // assuming the second tap is after tentativeStart.
    if (pickerState.selectionPhase === "awaitingEnd" && newStart && newEnd) {
      const result = applySecondTap(newStart, newEnd);
      capturedPrevRef.current = {
        prevStart: result.proposedStart,
        prevEnd: result.proposedEnd,
        prevSpanDays: Math.min(result.proposedEnd.diff(result.proposedStart, "day"), maxRange),
      };
      setPickerState((prev) => ({
        ...prev,
        selectionPhase: "idle",
        tentativeStart: null,
        proposedStart: result.proposedStart,
        proposedEnd: result.proposedEnd,
        dynamicMaxDate: null,
      }));
      return;
    }

    // First-tap branch. The library reports the user's click in whichever of (startDate, endDate)
    // differs from our prior proposed state — when the user clicks within the existing range,
    // the library keeps the existing start and reports the click as endDate.
    const proposedStartStr = pickerState.proposedStart.format("YYYY-MM-DD");
    const proposedEndStr = pickerState.proposedEnd?.format("YYYY-MM-DD") ?? null;
    let tapped: Dayjs | null = null;
    if (newStart && newStart.format("YYYY-MM-DD") !== proposedStartStr) {
      tapped = newStart;
    } else if (newEnd && newEnd.format("YYYY-MM-DD") !== proposedEndStr) {
      tapped = newEnd;
    } else if (newStart && !pickerState.proposedEnd) {
      // Awaiting-end fallback: only one date returned, treat as the tap
      tapped = newStart;
    }

    if (!tapped) {
      return;
    }

    const { prevStart, prevEnd, prevSpanDays } = capturedPrevRef.current;
    const result: FirstTapResult = applyFirstTap({
      tapped,
      prevStart,
      prevEnd,
      prevSpanDays,
      maxRange,
      minDate: resolvedMinDate,
      maxDate: resolvedMaxDate,
    });

    if (result.phase === "awaitingEnd") {
      // Do NOT re-anchor during Case 2a — anchor updates only when the range is complete
      setPickerState((prev) => ({
        ...prev,
        selectionPhase: "awaitingEnd",
        tentativeStart: result.tentativeStart,
        proposedStart: result.proposedStart,
        proposedEnd: null,
        dynamicMaxDate: result.maxDate,
      }));
    } else {
      // Re-anchor so any subsequent tap classifies against the new proposed range
      capturedPrevRef.current = {
        prevStart: result.proposedStart,
        prevEnd: result.proposedEnd,
        prevSpanDays: Math.min(result.proposedEnd.diff(result.proposedStart, "day"), maxRange),
      };
      setPickerState((prev) => ({
        ...prev,
        selectionPhase: "idle",
        tentativeStart: null,
        proposedStart: result.proposedStart,
        proposedEnd: result.proposedEnd,
        dynamicMaxDate: null,
      }));
    }
  };

  const handleClose = () => {
    if (isNative) {
      bottomSheetRef.current?.dismiss();
    } else {
      setWebModalVisible(false);
      hidePicker();
    }
  };

  const handleSet = () => {
    if (!pickerState.proposedEnd) {
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
    effectiveMaxDate,
    onPickerChange: handlePickerChange,
    onSet: handleSet,
    onCancel: handleCancel,
  };

  return (
    <>
      <Pressable testID="range-v1-trigger" onPress={handleOpen} style={$pillStyle}>
        <Icon
          name="calendar"
          color={Colors.darkGrey}
          size={Spacing.medium}
          right={Spacing.extraSmall}
        />
        <RegularText text={`${formattedStart} – ${formattedEnd}`} />
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

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
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

export default DateRangePickerRangeV1;
