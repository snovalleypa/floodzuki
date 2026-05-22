import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { View, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";

import { isWeb } from "@common-ui/utils/responsive";

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

  const goToIndex = useCallback(
    (target: number) => {
      const clamped = Math.max(0, Math.min(pages.length - 1, target));
      if (clamped === currentIndex) {
        return;
      }
      setCurrentIndex(clamped);
      router.replace(pages[clamped].route as any);
    },
    [currentIndex, pages, router]
  );

  const contextValue = useMemo<ChainPagerContextValue>(
    () => ({ currentIndex, pagesLength: pages.length, goToIndex }),
    [currentIndex, pages.length, goToIndex]
  );

  if (isWeb) {
    return (
      <ChainPagerContext.Provider value={contextValue}>
        {pages[currentIndex]?.render() ?? null}
      </ChainPagerContext.Provider>
    );
  }

  return (
    <ChainPagerContext.Provider value={contextValue}>
      <View style={{ flex: 1, overflow: "hidden" }}>
        <View
          style={{
            flexDirection: "row",
            width: pages.length * screenWidth,
            height: "100%",
            transform: [{ translateX: -currentIndex * screenWidth }],
          }}>
          {pages.map((page, i) => {
            const isAdjacent = Math.abs(i - currentIndex) <= 1;
            return (
              <View key={page.key} style={{ width: screenWidth, height: "100%" }}>
                {isAdjacent ? page.render() : null}
              </View>
            );
          })}
        </View>
      </View>
    </ChainPagerContext.Provider>
  );
}
