import React from "react";
import { Pressable, View, ViewStyle, ImageStyle } from "react-native";
import { Image } from "expo-image";
import { TinyText } from "@common-ui/components/Text";
import { Colors } from "@common-ui/constants/colors";
import { Spacing } from "@common-ui/constants/spacing";
import { useLocale } from "@common-ui/contexts/LocaleContext";
import { MapBaseLayer } from "@models/MapModels";

type Props = {
  baseLayer: MapBaseLayer;
  onPress: () => void;
};

// Show the target mode's thumbnail (the mode tapping switches you TO).
const THUMBNAILS = {
  [MapBaseLayer.Satellite]: require("@assets/images/baselayer-satellite.png"),
  [MapBaseLayer.Map]: require("@assets/images/baselayer-map.png"),
};

// A Google-Maps-style corner button that previews the OTHER mode you can switch
// to: on the vector map it shows a satellite thumbnail labeled "Satellite"; on
// satellite it shows a map thumbnail labeled "Map".
export default function MapBaseLayerToggle({ baseLayer, onPress }: Props) {
  const { t } = useLocale();
  const onMap = baseLayer === MapBaseLayer.Map;
  const targetLayer = onMap ? MapBaseLayer.Satellite : MapBaseLayer.Map;

  const label = onMap ? t("map.baseLayer.satellite") : t("map.baseLayer.map");
  const a11yLabel = onMap ? t("map.baseLayer.switchToSatellite") : t("map.baseLayer.switchToMap");

  return (
    <Pressable
      testID="baseLayerToggle"
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      onPress={onPress}
      style={$thumbButton}>
      <Image source={THUMBNAILS[targetLayer]} style={$thumbImage} contentFit="cover" />
      <View style={$thumbLabelStrip}>
        <TinyText color={Colors.white} align="center">
          {label}
        </TinyText>
      </View>
    </Pressable>
  );
}

const THUMB_WIDTH = 84;
const THUMB_HEIGHT = 60;

const $thumbButton: ViewStyle = {
  width: THUMB_WIDTH,
  height: THUMB_HEIGHT,
  borderRadius: Spacing.small,
  overflow: "hidden",
  borderWidth: 2,
  borderColor: Colors.white,
  backgroundColor: Colors.white,
  shadowColor: Colors.dark,
  shadowOpacity: 0.3,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 2 },
  elevation: 4,
};

const $thumbImage: ImageStyle = {
  width: "100%",
  height: "100%",
};

const $thumbLabelStrip: ViewStyle = {
  position: "absolute",
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0,0,0,0.55)",
  paddingVertical: 1,
};
