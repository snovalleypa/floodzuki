import React, { useState } from "react";
import { Modal, Pressable, ScrollView, View, ViewStyle, ActivityIndicator } from "react-native";
import { Row, Cell } from "@common-ui/components/Common";
import Icon from "@common-ui/components/Icon";
import {
  LabelText,
  MediumText,
  RegularText,
  SmallText,
  SmallTitle,
  TinyText,
} from "@common-ui/components/Text";
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
  subCaption?: string;
  onPress: () => void;
};

function Segment({ active, label, caption, subCaption, onPress }: SegmentProps) {
  return (
    <Pressable onPress={onPress} style={[$segment, active ? $segmentActive : undefined]}>
      <Cell align="center" innerHorizontal={Spacing.small} innerVertical={Spacing.tiny}>
        <LabelText color={active ? Colors.white : Colors.lightDark}>{label}</LabelText>
        {caption ? (
          <TinyText color={active ? Colors.white : Colors.darkGrey}>{caption}</TinyText>
        ) : null}
        {subCaption ? (
          <TinyText color={active ? Colors.white : Colors.darkGrey}>{subCaption}</TinyText>
        ) : null}
      </Cell>
    </Pressable>
  );
}

// One row of the road-color legend: a short colored line swatch matching the
// map's road-closure colors, followed by its meaning.
function RoadLegendRow({ color, text }: { color: string; text: string }) {
  return (
    <Row top={Spacing.extraSmall}>
      <View style={[$roadSwatch, { backgroundColor: color }]} />
      <Cell flex left={Spacing.small}>
        <SmallText color={Colors.lightDark}>{text}</SmallText>
      </Cell>
    </Row>
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
  const [infoVisible, setInfoVisible] = useState(false);

  // Gauge height for a level, rounded to one decimal place (e.g. "53.7 ft").
  // Undefined when the config omits a height so the segment skips that line.
  const formatFeet = (feet: number | null) =>
    feet === null
      ? undefined
      : `${feet.toLocaleString(undefined, {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })} ${t("measure.ft")}`;

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
        <Row align="center" bottom={Spacing.tiny}>
          <MediumText color={Colors.lightDark} align="center">
            {t("map.floodVisualizerTitle")}
          </MediumText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("map.info.buttonLabel")}
            hitSlop={Spacing.small}
            onPress={() => setInfoVisible(true)}
            style={$infoButton}>
            <Icon name="info" size={Spacing.medium} color={Colors.darkGrey} />
          </Pressable>
        </Row>
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
              subCaption={formatFeet(level.feet)}
              onPress={() => onSelect(level.key)}
            />
          ))}
        </Row>
      </View>

      <Modal
        visible={infoVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setInfoVisible(false)}>
        <Pressable style={$infoOverlay} onPress={() => setInfoVisible(false)}>
          {/* Stop propagation so taps inside the card don't dismiss the modal. */}
          <Pressable style={$infoCard} onPress={() => {}}>
            <Row align="space-between" bottom={Spacing.small}>
              <Cell flex right={Spacing.small}>
                <SmallTitle color={Colors.lightDark}>{t("map.info.title")}</SmallTitle>
              </Cell>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("map.info.close")}
                hitSlop={Spacing.small}
                onPress={() => setInfoVisible(false)}>
                <Icon name="x" size={Spacing.large} color={Colors.darkGrey} />
              </Pressable>
            </Row>
            <ScrollView
              style={$infoScroll}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={$infoScrollContent}>
              <RegularText color={Colors.lightDark}>{t("map.info.intro")}</RegularText>
              <Cell top={Spacing.small}>
                <RegularText color={Colors.lightDark}>{t("map.info.extent")}</RegularText>
              </Cell>
              <Cell top={Spacing.small}>
                <RegularText color={Colors.lightDark}>{t("map.info.cfs")}</RegularText>
              </Cell>
              <Cell top={Spacing.small}>
                <RegularText color={Colors.lightDark}>{t("map.info.modeled")}</RegularText>
              </Cell>

              <Cell top={Spacing.medium}>
                <MediumText color={Colors.lightDark}>{t("map.info.roadsHeading")}</MediumText>
              </Cell>
              <RoadLegendRow color={Colors.success} text={t("map.info.roadOpen")} />
              <RoadLegendRow color={Colors.warning} text={t("map.info.roadPossible")} />
              <RoadLegendRow color={Colors.danger} text={t("map.info.roadClosed")} />
              <Cell top={Spacing.medium}>
                <RegularText color={Colors.darkGrey}>{t("map.info.roadsNote")}</RegularText>
              </Cell>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
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

const $infoButton: ViewStyle = {
  marginLeft: Spacing.tiny,
};

const $segment: ViewStyle = {
  borderRadius: Spacing.small,
};

const $segmentActive: ViewStyle = {
  backgroundColor: Colors.primary,
};

const $infoOverlay: ViewStyle = {
  flex: 1,
  backgroundColor: "rgba(0,0,0,0.4)",
  justifyContent: "center",
  alignItems: "center",
  padding: Spacing.medium,
};

const $infoCard: ViewStyle = {
  backgroundColor: Colors.white,
  borderRadius: Spacing.medium,
  padding: Spacing.large,
  maxWidth: 420,
  width: "100%",
  maxHeight: "80%",
};

const $infoScroll: ViewStyle = {
  flexShrink: 1,
};

const $infoScrollContent: ViewStyle = {
  paddingBottom: Spacing.tiny,
};

const $roadSwatch: ViewStyle = {
  width: Spacing.large,
  height: Spacing.tiny,
  borderRadius: Spacing.micro,
  marginTop: Spacing.micro,
};
