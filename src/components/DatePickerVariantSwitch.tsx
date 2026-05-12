import React from "react";
import { Dayjs } from "dayjs";
import DateRangePicker from "@common-ui/components/DateRangePicker";
import { SplitDateRangePicker } from "@common-ui/components/SplitDateRangePicker";
import { DateRangePickerRangeV1 } from "@common-ui/components/DateRangePickerRangeV1";
import { DateRangePickerRangeV2 } from "@common-ui/components/DateRangePickerRangeV2";
import Config from "@config/config";

type DatePickerVariantSwitchProps = {
  locationId: string | undefined;
  startDate: Dayjs;
  endDate: Dayjs;
  timezone: string;
  onChange: (startDate: Dayjs, endDate: Dayjs) => void;
  onRangeRestricted?: () => void;
};

const DatePickerVariantSwitch = (props: DatePickerVariantSwitchProps) => {
  const { locationId, startDate, endDate, timezone, onChange, onRangeRestricted } = props;

  const variant =
    Config.DATE_PICKER_VARIANT.byLocationId[locationId] ?? Config.DATE_PICKER_VARIANT.default;

  if (variant === "split-v1") {
    return (
      <SplitDateRangePicker
        startDate={startDate}
        endDate={endDate}
        timezone={timezone}
        onChange={onChange}
        onRangeRestricted={onRangeRestricted}
      />
    );
  }

  if (variant === "range-v1") {
    return (
      <DateRangePickerRangeV1
        startDate={startDate}
        endDate={endDate}
        timezone={timezone}
        onChange={onChange}
      />
    );
  }

  if (variant === "range-v2") {
    return (
      <DateRangePickerRangeV2
        startDate={startDate}
        endDate={endDate}
        timezone={timezone}
        onChange={onChange}
        onRangeRestricted={onRangeRestricted}
      />
    );
  }

  return <DateRangePicker startDate={startDate} endDate={endDate} onChange={onChange} />;
};

export default DatePickerVariantSwitch;
