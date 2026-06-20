import React from "react";
import { Pressable, View, ViewStyle, ActivityIndicator } from "react-native";
import { Row, Cell } from "@common-ui/components/Common";
import { LabelText, TinyText } from "@common-ui/components/Text";
import { Colors } from "@common-ui/constants/colors";
import { Spacing } from "@common-ui/constants/spacing";
import { useLocale } from "@common-ui/contexts/LocaleContext";
import { useUtils } from "@utils/utils";
import type { InundationLevel } from "./inundationOverlay";

type InundationControlProps = {
  levels: InundationLevel[];
  selectedKey: string | null;
  onSelect: (key: string | null) => void;
  loading?: boolean;
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
}: InundationControlProps) {
  const { t } = useLocale();
  const { formatFlow } = useUtils();

  return (
    <View style={$container}>
      <View style={$pill}>
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
              label={t(level.labelTx as never)}
              caption={formatFlow(level.cfs)}
              onPress={() => onSelect(level.key)}
            />
          ))}
          {loading ? (
            <Cell align="center" innerHorizontal={Spacing.small}>
              <ActivityIndicator color={Colors.primary} />
            </Cell>
          ) : null}
        </Row>
      </View>
    </View>
  );
}

const $container: ViewStyle = {
  alignItems: "center",
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
