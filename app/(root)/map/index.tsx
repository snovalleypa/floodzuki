import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, ViewStyle } from "react-native";
import { ErrorBoundaryProps } from "expo-router";
import { observer } from "mobx-react-lite";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import PageTitle from "@common-ui/components/PageTitle";
import { ErrorDetails } from "@components/ErrorDetails";
import GageMap from "@components/GageMap";
import InundationControl from "@components/InundationControl";
import { getInundationLevels } from "@components/inundationOverlay";
import { useStores } from "@models/helpers/useStores";
import { Spacing } from "@common-ui/constants/spacing";
import { useLocale } from "@common-ui/contexts/LocaleContext";

export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorDetails {...props} />;
}

const MapScreen = observer(function MapScreen() {
  const { regionStore, getLocationsWithGages } = useStores();
  const { t } = useLocale();
  const insets = useSafeAreaInsets();

  const levels = useMemo(() => getInundationLevels(), []);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const loadTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearLoadTimeout = () => {
    if (loadTimeout.current) {
      clearTimeout(loadTimeout.current);
      loadTimeout.current = null;
    }
  };

  const handleSelect = useCallback((key: string | null) => {
    setSelectedKey(key);
    clearLoadTimeout();
    if (key === null) {
      setLoading(false);
      return;
    }
    setLoading(true);
    // Safety fallback so the spinner never hangs (covers native, where no
    // per-source load event is wired, and slow connections on web).
    loadTimeout.current = setTimeout(() => setLoading(false), 12000);
  }, []);

  const handleInundationLoad = useCallback(() => {
    clearLoadTimeout();
    setLoading(false);
  }, []);

  useEffect(() => clearLoadTimeout, []);

  const locations = getLocationsWithGages();

  const inundationUrl = useMemo(
    () => levels.find((l) => l.key === selectedKey)?.url ?? null,
    [levels, selectedKey]
  );

  const $controlWrap: ViewStyle = useMemo(
    () => ({
      position: "absolute",
      left: 0,
      right: 0,
      bottom: Math.max(insets.bottom, Spacing.medium),
    }),
    [insets.bottom]
  );

  return (
    <View style={$screen}>
      <PageTitle name={t("navigation.mapScreen")} />
      <GageMap
        gages={locations}
        region={regionStore.region}
        onGagePress={() => {}}
        cooperativeGestures={false}
        inundationUrl={inundationUrl}
        onInundationLoad={handleInundationLoad}
      />
      <View style={$controlWrap}>
        <InundationControl
          levels={levels}
          selectedKey={selectedKey}
          onSelect={handleSelect}
          loading={loading}
        />
      </View>
    </View>
  );
});

const $screen: ViewStyle = {
  flex: 1,
};

export default MapScreen;
