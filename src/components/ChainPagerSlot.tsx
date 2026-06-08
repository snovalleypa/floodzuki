import { createContext, useContext } from "react";

// Per-slot context for ChainPager: lets a page's descendants know whether
// they are the visible page or just an offscreen neighbor. Defaults to
// `isCurrent: true` so screens rendered outside a ChainPager (or via the
// web short-circuit where only the current page is mounted) behave as if
// they are active.
//
// Kept in its own file (no Reanimated / Gesture Handler imports) so that
// components like GageDetailsChart can read the flag in Jest without
// dragging in native animation deps.
export type ChainPagerSlotValue = { isCurrent: boolean };

export const ChainPagerSlotContext = createContext<ChainPagerSlotValue>({ isCurrent: true });

export function useChainPagerSlot(): ChainPagerSlotValue {
  return useContext(ChainPagerSlotContext);
}
