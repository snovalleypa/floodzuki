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

// initialIndex is consumed only at first mount. Every snap fires router.replace,
// which re-renders the parent screen with new URL params and a fresh
// initialIndex prop — if we honored it, the user's freshly-settled position
// would be clobbered on every swipe. Deliberate.
export function ChainPager({ pages, initialIndex }: ChainPagerProps) {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(() =>
    Math.max(0, Math.min(pages.length - 1, initialIndex))
  );

  const offsetX = useSharedValue(-currentIndex * screenWidth);
  const restOffsetX = useSharedValue(-currentIndex * screenWidth);

  useEffect(() => {
    restOffsetX.value = -currentIndex * screenWidth;
  }, [currentIndex, restOffsetX, screenWidth]);

  const handleSnapComplete = useCallback(
    (target: number) => {
      if (target === currentIndex) {
        return;
      }
      setCurrentIndex(target);
      router.replace(pages[target].route as any);
    },
    [currentIndex, pages, router]
  );

  const goToIndex = useCallback(
    (target: number) => {
      const clamped = Math.max(0, Math.min(pages.length - 1, target));
      if (clamped === currentIndex) {
        return;
      }
      const settle = -clamped * screenWidth;
      restOffsetX.value = settle;
      offsetX.value = withSpring(settle, { damping: 20, stiffness: 200 }, (finished) => {
        if (finished) {
          runOnJS(handleSnapComplete)(clamped);
        }
      });
    },
    [currentIndex, pages.length, screenWidth, offsetX, restOffsetX, handleSnapComplete]
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
      const minOffset = -(pages.length - 1) * screenWidth;
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
        currentIndex,
        e.translationX,
        e.velocityX,
        screenWidth,
        pages.length
      );
      const settle = -target * screenWidth;
      restOffsetX.value = settle;
      offsetX.value = withSpring(settle, { damping: 20, stiffness: 200 }, (finished) => {
        if (finished) {
          runOnJS(handleSnapComplete)(target);
        }
      });
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
              return (
                <View key={page.key} style={{ width: screenWidth, height: "100%" }}>
                  {isAdjacent ? page.render() : null}
                </View>
              );
            })}
          </Animated.View>
        </View>
      </GestureDetector>
    </ChainPagerContext.Provider>
  );
}
