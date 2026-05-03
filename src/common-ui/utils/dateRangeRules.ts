import type { Dayjs } from "dayjs";

export type RangeRulesBounds = {
  minDate: Dayjs; // earliest selectable date (e.g. 2019-10-01 in chart tz)
  maxDate: Dayjs; // latest selectable date (e.g. today end-of-day in chart tz)
  maxRange: number; // max span in days (default 30)
};

export type RangeRulesResult = {
  start: Dayjs;
  end: Dayjs;
  wasRestricted: boolean;
};

/**
 * Pure function that applies range-adjustment rules when one side of a date
 * range is changed. Preserves the previous span when possible, clamps to
 * bounds, and falls back to a 1-day range at the boundary edge.
 */
export function applyRangeRules(
  prev: { start: Dayjs; end: Dayjs },
  picked: Dayjs,
  side: "start" | "end",
  bounds: RangeRulesBounds
): RangeRulesResult {
  // Step 1: capture previous span (always >= 0)
  const prevSpanDays = prev.end.diff(prev.start, "day");

  // Step 2: clamp the picked date to bounds first
  let clampedPicked = picked;
  if (picked.isBefore(bounds.minDate)) {
    clampedPicked = bounds.minDate;
  } else if (picked.isAfter(bounds.maxDate)) {
    clampedPicked = bounds.maxDate;
  }

  // Step 3: build candidate using clamped picked date
  const candidate: RangeRulesResult =
    side === "start"
      ? { start: clampedPicked, end: prev.end, wasRestricted: false }
      : { start: prev.start, end: clampedPicked, wasRestricted: false };

  // Step 4: check if candidate is valid
  const candidateSpan = candidate.end.diff(candidate.start, "day");
  const candidateInOrder =
    candidate.start.isBefore(candidate.end) || candidate.start.isSame(candidate.end);
  const candidateWithinMaxRange = candidateSpan <= bounds.maxRange;
  const candidateStartInBounds =
    (candidate.start.isAfter(bounds.minDate) || candidate.start.isSame(bounds.minDate)) &&
    (candidate.start.isBefore(bounds.maxDate) || candidate.start.isSame(bounds.maxDate));
  const candidateEndInBounds =
    (candidate.end.isAfter(bounds.minDate) || candidate.end.isSame(bounds.minDate)) &&
    (candidate.end.isBefore(bounds.maxDate) || candidate.end.isSame(bounds.maxDate));

  const isValid =
    candidateInOrder && candidateWithinMaxRange && candidateStartInBounds && candidateEndInBounds;

  if (isValid) {
    return candidate;
  }

  // Step 5: derive the other date.
  //
  // Widen exception: if the candidate failed only because the span exceeded
  // maxRange (it was still in chronological order), AND the picked date hasn't
  // moved more than maxRange days from its previous position on the same side,
  // the user is likely trying to widen the range rather than navigate to a
  // different part of the calendar. In that case, expand to the full maxRange
  // instead of preserving the previous span.
  const candidateOverRangeOnly = candidateInOrder && !candidateWithinMaxRange;
  const distanceFromPrevSameSide =
    side === "start"
      ? prev.start.diff(clampedPicked, "day") // positive when picked is earlier
      : clampedPicked.diff(prev.end, "day"); // positive when picked is later
  const useWidenException = candidateOverRangeOnly && distanceFromPrevSameSide <= bounds.maxRange;

  const spanToDerive = useWidenException ? bounds.maxRange : prevSpanDays;

  let derivedStart: Dayjs;
  let derivedEnd: Dayjs;

  if (side === "start") {
    derivedStart = clampedPicked;
    derivedEnd = clampedPicked.add(spanToDerive, "day");
  } else {
    derivedEnd = clampedPicked;
    derivedStart = clampedPicked.subtract(spanToDerive, "day");
  }

  // Step 6: clamp the derived date to bounds
  if (side === "start") {
    if (derivedEnd.isAfter(bounds.maxDate)) {
      derivedEnd = bounds.maxDate;
    }
    if (derivedEnd.isBefore(bounds.minDate)) {
      derivedEnd = bounds.minDate;
    }
    // If clamping caused zero or negative span, fallback to 1-day range
    if (!derivedEnd.isAfter(derivedStart)) {
      derivedEnd = derivedStart.add(1, "day");
      // Clamp again
      if (derivedEnd.isAfter(bounds.maxDate)) {
        derivedEnd = bounds.maxDate;
      }
    }
  } else {
    if (derivedStart.isBefore(bounds.minDate)) {
      derivedStart = bounds.minDate;
    }
    if (derivedStart.isAfter(bounds.maxDate)) {
      derivedStart = bounds.maxDate;
    }
    // If clamping caused zero or negative span, fallback to 1-day range
    if (!derivedStart.isBefore(derivedEnd)) {
      derivedStart = derivedEnd.subtract(1, "day");
      // Clamp again
      if (derivedStart.isBefore(bounds.minDate)) {
        derivedStart = bounds.minDate;
      }
    }
  }

  return { start: derivedStart, end: derivedEnd, wasRestricted: useWidenException };
}
