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
  const [error, setError] = useState(false);
  // Bumped only when the already-selected level is re-tapped (e.g. to retry after
  // an error). Folded into the inundation URL so a re-tap actually changes the URL
  // and forces a refetch; otherwise selectedKey is unchanged and nothing reloads.
  const [reloadNonce, setReloadNonce] = useState(0);
  const loadTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearLoadTimeout = () => {
    if (loadTimeout.current) {
      clearTimeout(loadTimeout.current);
      loadTimeout.current = null;
    }
  };

  const handleSelect = useCallback(
    (key: string | null) => {
      setError(false);
      clearLoadTimeout();
      if (key === null) {
        setSelectedKey(null);
        setLoading(false);
        return;
      }
      // Re-tapping the current level wouldn't change the URL, so force a refetch.
      if (key === selectedKey) {
        setReloadNonce((n) => n + 1);
      }
      setSelectedKey(key);
      setLoading(true);
      // Safety fallback so the spinner never hangs (covers slow connections and any
      // case where neither the load nor error signal arrives).
      loadTimeout.current = setTimeout(() => setLoading(false), 12000);
    },
    [selectedKey]
  );

  const handleInundationLoad = useCallback(() => {
    clearLoadTimeout();
    setLoading(false);
    setError(false);
  }, []);

  const handleInundationError = useCallback(() => {
    clearLoadTimeout();
    setLoading(false);
    setError(true);
  }, []);

  useEffect(() => clearLoadTimeout, []);

  const locations = getLocationsWithGages();

  const inundationUrl = useMemo(() => {
    const level = levels.find((l) => l.key === selectedKey);
    if (!level) {
      return null;
    }
    if (reloadNonce === 0) {
      return level.url;
    }
    const separator = level.url.includes("?") ? "&" : "?";
    return `${level.url}${separator}_retry=${reloadNonce}`;
  }, [levels, selectedKey, reloadNonce]);

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
        useCooperativeGestures={false}
        inundationUrl={inundationUrl}
        onInundationLoad={handleInundationLoad}
        onInundationError={handleInundationError}
      />
      <View style={$controlWrap}>
        <InundationControl
          levels={levels}
          selectedKey={selectedKey}
          onSelect={handleSelect}
          loading={loading}
          error={error}
        />
      </View>
    </View>
  );
});

const $screen: ViewStyle = {
  flex: 1,
};

export default MapScreen;
