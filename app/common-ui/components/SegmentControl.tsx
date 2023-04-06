import React from "react"
import { Pressable, View, ViewStyle } from "react-native"

import { MediumTitle, SmallTitle } from "./Text"

import { Colors } from "@common-ui/constants/colors"
import { Spacing } from "@common-ui/constants/spacing"
import { OffsetProps, useOffsetStyles } from "@common-ui/utils/useOffset"
import { useResponsive } from "@common-ui/utils/responsive"

type Segment = {
  key: string;
  title: string;
}

type SegmentControlProps = {
  segments: Segment[]
  selectedSegment: string
  onChange: (segment: string) => void
} & OffsetProps


/**
 * SegmentControl is a component that allows the user to select one of a set of options.
 * @param {Segment[]} segments - selectable options
 * @param {string} selectedSegment - selected option
 * @param {function} onChange - callback function to be called when the user selects an option
 * @returns 
 */

export function SegmentControl(props: SegmentControlProps) {
  const { segments, selectedSegment, onChange, ...rest } = props

  const [selected, setSelected] = React.useState(selectedSegment)

  const onSegmentPress = (segmentKey: string) => {
    setSelected(segmentKey)
    onChange(segmentKey)
  }

  const $style: ViewStyle[] = useOffsetStyles([$segmentHolder], rest)

  return (
    <View style={$style}>
      {segments.map((segment) => (
        <SegmentItem
          key={segment.key}
          segment={segment}
          isSelected={segment.key === selected}
          onPress={onSegmentPress}
        />
      ))}
    </View>
  )
}

const SegmentItem = React.memo(
  function SegmentItem({ segment, isSelected, onPress }: { segment: Segment, isSelected: boolean, onPress: (segmentKey: string) => void }) {
    const key = segment.key

    const { isMobile } = useResponsive()

    const handlePress = () => {
      onPress(segment.key)
    }

    const $textColor = isSelected ? Colors.primary : Colors.dark

    const TextComponent = isMobile ? SmallTitle : MediumTitle

    return (
      <Pressable
        key={key}
        onPress={handlePress}
        style={state => [
          $segmentStyle,
          state.pressed && $segmentPressed,
          state.hovered && $segmentHovered,
        ]}
  
      >
        <TextComponent
          color={$textColor}
          align="center">
          {segment.title}
        </TextComponent>
      </Pressable>
    )
  },
  (prevProps, nextProps) => {
    return prevProps.isSelected === nextProps.isSelected
  }
)

const $segmentHolder: ViewStyle = {
  flexDirection: "row",
  justifyContent: "center",
  alignItems: "center",
  marginBottom: Spacing.small,
}

const $segmentStyle: ViewStyle = {
  paddingHorizontal: Spacing.extraSmall,
  paddingVertical: Spacing.extraSmall,
  backgroundColor: "transparent",
  borderRadius: Spacing.extraSmall,
}

const $segmentPressed: ViewStyle = {
  backgroundColor: Colors.lightGrey,
  opacity: 0.8,
}

const $segmentHovered: ViewStyle = {
  backgroundColor: Colors.lightGrey,
  opacity: 0.8,
}
