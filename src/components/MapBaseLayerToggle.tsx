import React from "react";
import { Pressable, View, ViewStyle, TextStyle } from "react-native";
import { LabelText } from "@common-ui/components/Text";
import Icon from "@common-ui/components/Icon";
import { Colors } from "@common-ui/constants/colors";
import { Spacing } from "@common-ui/constants/spacing";
import { useLocale } from "@common-ui/contexts/LocaleContext";
import { MapBaseLayer } from "@models/MapModels";

type Props = {
  baseLayer: MapBaseLayer;
  onPress: () => void;
};

// A Google-Maps-style corner button that shows the OTHER mode you can switch to:
// while on the vector map it offers "Satellite"; while on satellite it offers "Map".
export default function MapBaseLayerToggle({ baseLayer, onPress }: Props) {
  const { t } = useLocale();
  const onMap = baseLayer === MapBaseLayer.Map;

  // Show the target mode's affordance.
  const iconName = onMap ? "globe" : "map";
  const label = onMap ? t("map.baseLayer.satellite") : t("map.baseLayer.map");
  const a11yLabel = onMap ? t("map.baseLayer.switchToSatellite") : t("map.baseLayer.switchToMap");

  return (
    <Pressable
      testID="baseLayerToggle"
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      onPress={onPress}
      style={$button}>
      <View style={$row}>
        <Icon name={iconName} size={Spacing.medium} color={Colors.lightDark} />
        <LabelText color={Colors.lightDark} textStyle={[$label]}>
          {label}
        </LabelText>
      </View>
    </Pressable>
  );
}

const $button: ViewStyle = {
  backgroundColor: Colors.white,
  borderRadius: Spacing.medium,
  paddingHorizontal: Spacing.small,
  paddingVertical: Spacing.tiny,
  shadowColor: Colors.dark,
  shadowOpacity: 0.2,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 2 },
  elevation: 4,
};

const $row: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
};

const $label: TextStyle = {
  marginLeft: Spacing.tiny,
};
