export interface PeakLike {
  timestampMs?: number | null;
}

export function buildCrestTimestampSet(peaks?: PeakLike[] | null): Set<number> {
  const set = new Set<number>();
  if (!peaks) {
    return set;
  }
  for (const peak of peaks) {
    if (typeof peak?.timestampMs === "number") {
      set.add(peak.timestampMs);
    }
  }
  return set;
}
