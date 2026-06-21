import React from "react";
import { Pressable, View, ViewStyle, ActivityIndicator } from "react-native";
import { Row, Cell } from "@common-ui/components/Common";
import { LabelText, MediumText, SmallText, TinyText } from "@common-ui/components/Text";
import { Colors } from "@common-ui/constants/colors";
import { Spacing } from "@common-ui/constants/spacing";
import { useLocale } from "@common-ui/contexts/LocaleContext";
import { useUtils } from "@utils/utils";
import { localizeLevelLabel, type InundationLevel } from "./inundationOverlay";

type InundationControlProps = {
  levels: InundationLevel[];
  selectedKey: string | null;
  onSelect: (key: string | null) => void;
  loading?: boolean;
  error?: boolean;
};

type SegmentProps = {
  active: boolean;
  label: string;
  caption?: string;
  onPress: () => void;
};

function Segment({ active, label, caption, onPress }: SegmentProps) {
  return (
    <Pressable onPress={onPress} style={[$segment, active ? $segmentActive : undefined]}>
      <Cell align="center" innerHorizontal={Spacing.small} innerVertical={Spacing.tiny}>
        <LabelText color={active ? Colors.white : Colors.lightDark}>{label}</LabelText>
        {caption ? (
          <TinyText color={active ? Colors.white : Colors.darkGrey}>{caption}</TinyText>
        ) : null}
      </Cell>
    </Pressable>
  );
}

export default function InundationControl({
  levels,
  selectedKey,
  onSelect,
  loading,
  error,
}: InundationControlProps) {
  const { t, locale } = useLocale();
  const { formatFlow } = useUtils();

  return (
    <View style={$container}>
      {/* The spinner and error banner float above the pill and out of layout flow,
          so showing/hiding them never resizes the pill (loads are often fast, and a
          resizing pill is distracting). pointerEvents none keeps them from blocking
          segment taps. The error takes priority over the spinner. */}
      {error ? (
        <View style={$bannerWrap} pointerEvents="none">
          <View style={$errorBanner}>
            <SmallText color={Colors.white} align="center">
              {t("map.loadError")}
            </SmallText>
          </View>
        </View>
      ) : null}
      {!error && loading ? (
        <View style={$bannerWrap} pointerEvents="none">
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : null}
      <View style={$pill}>
        <Cell bottom={Spacing.tiny} align="center">
          <MediumText color={Colors.lightDark} align="center">
            {t("map.floodVisualizerTitle")}
          </MediumText>
        </Cell>
        <Row>
          <Segment
            active={selectedKey === null}
            label={t("map.levelNone")}
            onPress={() => onSelect(null)}
          />
          {levels.map((level) => (
            <Segment
              key={level.key}
              active={selectedKey === level.key}
              label={localizeLevelLabel(level.label, locale)}
              caption={formatFlow(level.cfs)}
              onPress={() => onSelect(level.key)}
            />
          ))}
        </Row>
      </View>
    </View>
  );
}

const $container: ViewStyle = {
  alignItems: "center",
};

const $bannerWrap: ViewStyle = {
  position: "absolute",
  bottom: "100%",
  left: 0,
  right: 0,
  alignItems: "center",
  marginBottom: Spacing.small,
  paddingHorizontal: Spacing.medium,
};

const $errorBanner: ViewStyle = {
  backgroundColor: Colors.danger,
  borderRadius: Spacing.small,
  paddingHorizontal: Spacing.medium,
  paddingVertical: Spacing.extraSmall,
  maxWidth: 360,
};

const $pill: ViewStyle = {
  backgroundColor: Colors.white,
  borderRadius: Spacing.medium,
  paddingHorizontal: Spacing.tiny,
  paddingVertical: Spacing.tiny,
  shadowColor: Colors.dark,
  shadowOpacity: 0.2,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 2 },
  elevation: 4,
};

const $segment: ViewStyle = {
  borderRadius: Spacing.small,
};

const $segmentActive: ViewStyle = {
  backgroundColor: Colors.primary,
};
