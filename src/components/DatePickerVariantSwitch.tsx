import React from "react";
import { Dayjs } from "dayjs";
import DateRangePicker from "@common-ui/components/DateRangePicker";
import Config from "@config/config";

type DatePickerVariantSwitchProps = {
  locationId: string;
  startDate: Dayjs;
  endDate: Dayjs;
  onChange: (startDate: Dayjs, endDate: Dayjs) => void;
};

const DatePickerVariantSwitch = (props: DatePickerVariantSwitchProps) => {
  const { locationId, startDate, endDate, onChange } = props;

  const variant =
    Config.DATE_PICKER_VARIANT.byLocationId[locationId] ?? Config.DATE_PICKER_VARIANT.default;

  if (variant === "split-v1") {
    // TODO: render SplitDateRangePicker when variant === 'split-v1'
    return <DateRangePicker startDate={startDate} endDate={endDate} onChange={onChange} />;
  }

  return <DateRangePicker startDate={startDate} endDate={endDate} onChange={onChange} />;
};

export default DatePickerVariantSwitch;
