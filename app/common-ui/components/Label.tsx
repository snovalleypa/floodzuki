import React from "react"
import { ColorValue, ViewStyle, TextStyle, View } from "react-native"
import { Colors, ColorTypes } from "@common-ui/constants/colors"
import { Spacing } from "@common-ui/constants/spacing"
import { OffsetProps, useOffsetStyles } from "@common-ui/utils/useOffset"
import { LargeTitle, SmallText, SmallTitle } from "./Text"
import { useResponsive } from "@common-ui/utils/responsive"

const LARGE_LABEL_COLORS = {
  "success": {
    backgroundColor: "#e8f4d1",
    textColor: "#9fd140",
  },
  "warning": {
    backgroundColor: "#ffeac2",
    textColor: "#ffa700",
  },
  "danger": {
    backgroundColor: "#fad4d4",
    textColor: "#ea4b4b",
  },
  "offline": {
    backgroundColor: "#fff",
    textColor: "#b1b1b1",
  }
}

type LargeLabelType = keyof typeof LARGE_LABEL_COLORS

type labelProps = {
  text: string
  type?: keyof typeof ColorTypes
  textColor?: ColorValue
  backgroundColor?: ColorValue
  style?: ViewStyle
} & OffsetProps

type largeLabelProps = {
  text: string
  type?: LargeLabelType
} & OffsetProps

/**
 * A label component useful to drive attention to some texts (mostly statuses)
 * @param {string} text - Text to display in the label
 * @param {keyof typeof ColorTypes} type - Type of label to display from the ColorTypes
 * @param {ColorValue} textColor - Color of the text
 * @param {ColorValue} backgroundColor - Color of the background
 * @param {ViewStyle} style - Style to apply to the label
 * @param {OffsetProps} offsetProps - Props to apply offsets to the label
 *
 * @example
 * <label text="1" type="primary" small />
 */
export function Label(props: labelProps) {
  const { text, type, style, textColor, backgroundColor, ...offsetProps } = props

  let labelStyle: ViewStyle[] = [$label]
  const textStyle: TextStyle[] = [$text]

  labelStyle = useOffsetStyles(labelStyle, offsetProps)

  if (type) {
    labelStyle.push({ backgroundColor: Colors[type] })
  }

  if (backgroundColor) {
    labelStyle.push({ backgroundColor })
  }

  if (textColor) {
    textStyle.push({ color: textColor })
  }

  if (style) {
    labelStyle.push(style)
  }

  return (
    <View style={labelStyle}>
      <SmallText textStyle={textStyle}>{text}</SmallText>
    </View>
  )
}

export function LargeLabel(props: largeLabelProps) {
  const { text, type, ...offsetProps } = props

  const { isMobile } = useResponsive()

  let labelStyle: ViewStyle[] = [$largeLabel]
  const textStyle: TextStyle[] = [$largeText]

  labelStyle = useOffsetStyles(labelStyle, offsetProps)

  if (type) {
    labelStyle.push({ backgroundColor: LARGE_LABEL_COLORS[type].backgroundColor })
    textStyle.push({ color: LARGE_LABEL_COLORS[type].textColor })
  }

  const Text = isMobile ? SmallTitle : LargeTitle

  return (
    <View style={labelStyle}>
      <Text textStyle={textStyle}>{text}</Text>
    </View>
  )
}

const $label: ViewStyle = {
  alignItems: "center",
  borderWidth: 1,
  backgroundColor: Colors.white,
  borderRadius: Spacing.extraSmall,
  borderColor: Colors.midGrey,
  justifyContent: "center",
  paddingHorizontal: Spacing.extraSmall,
  paddingVertical: Spacing.tiny,
}

const $largeLabel: ViewStyle = {
  alignItems: "center",
  borderRadius: Spacing.extraSmall,
  paddingHorizontal: Spacing.medium,
  paddingVertical: Spacing.extraSmall
}

const $text: TextStyle = {
  color: Colors.lightDark,
  lineHeight: Spacing.medium,
}

const $largeText: TextStyle = {
  color: Colors.lightDark,
}
