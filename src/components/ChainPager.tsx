import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { View, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { isWeb } from "@common-ui/utils/responsive";

import { computeSnapTarget } from "./ChainPager.helpers";
import { ChainPagerSlotContext } from "./ChainPagerSlot";

export { ChainPagerSlotContext, useChainPagerSlot } from "./ChainPagerSlot";
export type { ChainPagerSlotValue } from "./ChainPagerSlot";

export type PageEntry = {
  key: string;
  route: { pathname: string; params: Record<string, any> };
  render: () => React.ReactNode;
};

type ChainPagerProps = {
  pages: PageEntry[];
  initialIndex: number;
};

type ChainPagerContextValue = {
  currentIndex: number;
  pagesLength: number;
  goToIndex: (target: number) => void;
};

export const ChainPagerContext = createContext<ChainPagerContextValue | null>(null);

export function useChainPager(): ChainPagerContextValue {
  const ctx = useContext(ChainPagerContext);
  if (!ctx) {
    throw new Error("useChainPager must be used inside <ChainPager>");
  }
  return ctx;
}

// initialIndex is consumed only at first mount. Every snap updates URL
// params via router.setParams, which re-renders the parent screen with a
// fresh initialIndex prop — if we honored it, the user's freshly-settled
// position would be clobbered on every swipe. Deliberate.
//
// State + URL updates fire at the START of the spring animation (from the
// gesture worklet via runOnJS, and synchronously from goToIndex), not after
// it. The currentIndex change causes the newly-adjacent page to mount during
// the spring, so by the time the animation settles the next swipe target is
// already rendered. Updating after the spring instead would leave a window
// where the next slot was still empty and a fast follow-up swipe would see
// stale state.
export function ChainPager({ pages, initialIndex }: ChainPagerProps) {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(() =>
    Math.max(0, Math.min(pages.length - 1, initialIndex))
  );

  const offsetX = useSharedValue(-currentIndex * screenWidth);
  const restOffsetX = useSharedValue(-currentIndex * screenWidth);
  // Live mirrors of JS state used inside the gesture worklets. Updated
  // synchronously when a snap target is determined, so back-to-back swipes
  // (started before React re-renders the gesture) still see the latest index
  // and page count instead of stale captured values.
  //
  // Invariant: anyone changing `currentIndex` must also set
  // `currentIndexSV.value` first (see advanceTo / goToIndex / pan.onEnd).
  // `pagesLengthSV` is synced by a useEffect since it follows a prop.
  const currentIndexSV = useSharedValue(currentIndex);
  const pagesLengthSV = useSharedValue(pages.length);

  useEffect(() => {
    restOffsetX.value = -currentIndex * screenWidth;
  }, [currentIndex, restOffsetX, screenWidth]);

  useEffect(() => {
    pagesLengthSV.value = pages.length;
  }, [pages.length, pagesLengthSV]);

  // Apply the React-state and URL changes for a new page. Called via runOnJS
  // from the gesture worklet (and directly from goToIndex) AT THE START of the
  // spring animation, not after — so the newly-adjacent page mounts during the
  // animation and the next swipe doesn't see an empty slot.
  const advanceTo = useCallback(
    (target: number) => {
      setCurrentIndex(target);
      router.setParams(pages[target].route.params as any);
    },
    [pages, router]
  );

  const goToIndex = useCallback(
    (target: number) => {
      const clamped = Math.max(0, Math.min(pages.length - 1, target));
      if (clamped === currentIndex) {
        return;
      }
      const settle = -clamped * screenWidth;
      restOffsetX.value = settle;
      currentIndexSV.value = clamped;
      advanceTo(clamped);
      offsetX.value = withSpring(settle, { damping: 60, stiffness: 400 });
    },
    [currentIndex, pages.length, screenWidth, offsetX, restOffsetX, currentIndexSV, advanceTo]
  );

  const contextValue = useMemo<ChainPagerContextValue>(
    () => ({ currentIndex, pagesLength: pages.length, goToIndex }),
    [currentIndex, pages.length, goToIndex]
  );

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-15, 15])
    .onUpdate((e) => {
      "worklet";
      const minOffset = -(pagesLengthSV.value - 1) * screenWidth;
      const maxOffset = 0;
      const raw = restOffsetX.value + e.translationX;
      if (raw > maxOffset) {
        offsetX.value = maxOffset + (raw - maxOffset) * 0.4;
      } else if (raw < minOffset) {
        offsetX.value = minOffset + (raw - minOffset) * 0.4;
      } else {
        offsetX.value = raw;
      }
    })
    .onEnd((e) => {
      "worklet";
      const target = computeSnapTarget(
        currentIndexSV.value,
        e.translationX,
        e.velocityX,
        screenWidth,
        pagesLengthSV.value
      );
      const settle = -target * screenWidth;
      restOffsetX.value = settle;
      if (target !== currentIndexSV.value) {
        currentIndexSV.value = target;
        runOnJS(advanceTo)(target);
      }
      offsetX.value = withSpring(settle, { damping: 60, stiffness: 400 });
    });

  // Keep static layout out of useAnimatedStyle — it should only carry the
  // animated transform so Reanimated doesn't re-evaluate flex/width every frame.
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offsetX.value }],
  }));

  if (isWeb) {
    return (
      <ChainPagerContext.Provider value={contextValue}>
        {pages[currentIndex]?.render() ?? null}
      </ChainPagerContext.Provider>
    );
  }

  const staticRowStyle = {
    flexDirection: "row" as const,
    width: pages.length * screenWidth,
    height: "100%" as const,
  };

  return (
    <ChainPagerContext.Provider value={contextValue}>
      <GestureDetector gesture={pan}>
        <View style={{ flex: 1, overflow: "hidden" }}>
          <Animated.View style={[staticRowStyle, animatedStyle]}>
            {pages.map((page, i) => {
              const isAdjacent = Math.abs(i - currentIndex) <= 1;
              const isCurrent = i === currentIndex;
              return (
                <View key={page.key} style={{ width: screenWidth, height: "100%" }}>
                  {isAdjacent ? (
                    <ChainPagerSlotContext.Provider value={{ isCurrent }}>
                      {page.render()}
                    </ChainPagerSlotContext.Provider>
                  ) : null}
                </View>
              );
            })}
          </Animated.View>
        </View>
      </GestureDetector>
    </ChainPagerContext.Provider>
  );
}
