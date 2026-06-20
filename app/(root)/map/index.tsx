import React, { useMemo, useState } from "react";
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

  const locations = getLocationsWithGages();

  const inundationUrl = useMemo(
    () => levels.find((l) => l.key === selectedKey)?.url ?? null,
    [levels, selectedKey]
  );

  const $controlWrap: ViewStyle = {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: Math.max(insets.bottom, Spacing.medium),
  };

  return (
    <View style={$screen}>
      <PageTitle name={t("navigation.mapScreen")} />
      <GageMap
        gages={locations}
        region={regionStore.region}
        onGagePress={() => {}}
        cooperativeGestures={false}
        inundationUrl={inundationUrl}
      />
      <View style={$controlWrap}>
        <InundationControl levels={levels} selectedKey={selectedKey} onSelect={setSelectedKey} />
      </View>
    </View>
  );
});

const $screen: ViewStyle = {
  flex: 1,
};

export default MapScreen;
