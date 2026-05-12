import type { Dayjs } from "dayjs";

export type FirstTapAwaitingEnd = {
  phase: "awaitingEnd";
  tentativeStart: Dayjs;
  proposedStart: Dayjs;
  proposedEnd: null;
  maxDate: Dayjs;
};

export type FirstTapIdle = {
  phase: "idle";
  proposedStart: Dayjs;
  proposedEnd: Dayjs;
  wasRestricted: boolean;
};

export type FirstTapResult = FirstTapAwaitingEnd | FirstTapIdle;

export type FirstTapInput = {
  tapped: Dayjs;
  prevStart: Dayjs;
  prevEnd: Dayjs;
  prevSpanDays: number;
  maxRange: number;
  minDate: Dayjs;
  maxDate: Dayjs;
};

export function applyFirstTap({
  tapped,
  prevStart,
  prevEnd,
  prevSpanDays,
  maxRange,
  minDate,
  maxDate,
}: FirstTapInput): FirstTapResult {
  // Case 2a: tapped within the existing range (inclusive on both ends)
  if (!tapped.isBefore(prevStart) && !tapped.isAfter(prevEnd)) {
    return {
      phase: "awaitingEnd",
      tentativeStart: tapped,
      proposedStart: tapped,
      proposedEnd: null,
      maxDate: tapped.add(maxRange, "day"),
    };
  }

  // Cases 2b / 2c: tapped before prevStart
  if (tapped.isBefore(prevStart)) {
    const daysBeforePrevStart = prevStart.diff(tapped, "day");
    if (daysBeforePrevStart <= maxRange) {
      // Case 2b: keep prevEnd if within maxRange of tapped, else cap at tapped + maxRange
      const cappedEnd = tapped.add(maxRange, "day");
      const wasRestricted = prevEnd.isAfter(cappedEnd);
      const rawEnd = wasRestricted ? cappedEnd : prevEnd;
      const proposedEnd = rawEnd.isAfter(maxDate) ? maxDate : rawEnd;
      return { phase: "idle", proposedStart: tapped, proposedEnd, wasRestricted };
    } else {
      // Case 2c: navigate to distant past — preserve span from new start
      const proposedStart = tapped.isBefore(minDate) ? minDate : tapped;
      const rawEnd = proposedStart.add(prevSpanDays, "day");
      const proposedEnd = rawEnd.isAfter(maxDate) ? maxDate : rawEnd;
      return { phase: "idle", proposedStart, proposedEnd, wasRestricted: false };
    }
  }

  // Cases 2d / 2e: tapped after prevEnd
  const daysAfterPrevEnd = tapped.diff(prevEnd, "day");
  if (daysAfterPrevEnd <= maxRange) {
    // Case 2d: keep prevStart if within maxRange of tapped, else pull forward to tapped - maxRange
    const pulledStart = tapped.subtract(maxRange, "day");
    const wasRestricted = prevStart.isBefore(pulledStart);
    const rawStart = wasRestricted ? pulledStart : prevStart;
    const proposedStart = rawStart.isBefore(minDate) ? minDate : rawStart;
    return { phase: "idle", proposedStart, proposedEnd: tapped, wasRestricted };
  } else {
    // Case 2e: navigate to distant future — preserve span from new start
    const rawEnd = tapped.add(prevSpanDays, "day");
    const proposedEnd = rawEnd.isAfter(maxDate) ? maxDate : rawEnd;
    return { phase: "idle", proposedStart: tapped, proposedEnd, wasRestricted: false };
  }
}

export function applySecondTap(tentativeStart: Dayjs, endDate: Dayjs): FirstTapIdle {
  return {
    phase: "idle",
    proposedStart: tentativeStart,
    proposedEnd: endDate,
    wasRestricted: false,
  };
}
