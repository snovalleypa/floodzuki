// src/services/mockReplay/timeShift.ts
export interface TimeAnchor {
  anchorRealMs: number;
  mockNowMs: number;
  delta: number;
}

export function createAnchor(mockNowMs: number, nowMs: number = Date.now()): TimeAnchor {
  return { anchorRealMs: nowMs, mockNowMs, delta: nowMs - mockNowMs };
}

export function effectiveMockNow(anchor: TimeAnchor, nowMs: number = Date.now()): number {
  return nowMs - anchor.delta;
}

export function shiftToDisplay(anchor: TimeAnchor, historicalMs: number): number {
  return historicalMs + anchor.delta;
}
