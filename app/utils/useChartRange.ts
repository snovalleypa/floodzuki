import { useRef } from "react";
import { Dayjs } from "dayjs";

import localDayJs from "@services/localDayJs";

const CHART_DEFAULT_RANGE = 2;

const useChartRange = (from?: string, to?: string) => {
  const local = localDayJs();
  const _end = useRef<Dayjs>(!!to ? localDayJs.tz(to) : localDayJs());

  const _isNow = useRef<boolean>(!to || local.format("YYYY-MM-DD") === to);

  const _days = useRef<number>(
    !!from ?
      Math.abs(localDayJs.tz(from).diff(_end.current, "days")) + 1 :
      CHART_DEFAULT_RANGE
  );

  const _inputEndDate = useRef<Dayjs>(_end.current);

  return {
    get isNow() {
      return _isNow.current;
    },
    get days() {
      return _days.current;
    },
    
    get inputStartDate() {
      const start = _inputEndDate.current.clone().startOf("day").subtract(_days.current - 1, "d");
      return start as Dayjs;
    },
    get inputEndDate() {
      const end = (_isNow.current ? localDayJs() : _inputEndDate.current.clone());
      return end.startOf("day") as Dayjs;
    },

    get chartStartDate() {
      if (_isNow.current) {
        return localDayJs().subtract(_days.current, "d");
      } else {
        return this.inputStartDate;
      }
    },
    get chartEndDate() {
      const endDate = _inputEndDate.current.clone()
      if (_isNow.current) {
        return localDayJs();
      } else {
        return _inputEndDate.current.clone().endOf("day");
      }
    },

    changeDays(days: number) {
      _days.current = days;
    },

    changeDates(inputStartDate: Dayjs, inputEndDate: Dayjs) {
      const now = localDayJs();

      if (!inputStartDate && !inputEndDate) {
        _isNow.current = true;
        _days.current = CHART_DEFAULT_RANGE;
        return;
      }

      if (!inputEndDate) {
        _isNow.current = false;
        _days.current = -(inputStartDate.clone().diff(_inputEndDate.current.clone(), "days"));
        return;
      }
      
      if (inputEndDate.clone().endOf("day") >= now) {
        _isNow.current = true;
        _inputEndDate.current = now;
      }
      else {
        _isNow.current = false;
        _inputEndDate.current = inputEndDate.clone().endOf("day");
      }

      _days.current = 
        _inputEndDate.current
        .clone()
        .startOf("day")
        .diff(inputStartDate.clone().startOf("day"), "days") + 1

      return;
    }
  }
}

export default useChartRange;
