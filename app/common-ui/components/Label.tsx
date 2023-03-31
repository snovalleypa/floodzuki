import React, { useMemo } from "react"
import { ColorValue, ViewStyle, TextStyle, View } from "react-native"
import { Colors, ColorTypes, Palette } from "@common-ui/constants/colors"
import { Spacing } from "@common-ui/constants/spacing"
import { OffsetProps, useOffsetStyles } from "@common-ui/utils/useOffset"
import { SmallText } from "./Text"

type labelProps = {
  text: string
  type?: keyof typeof ColorTypes
  textColor?: ColorValue
  backgroundColor?: ColorValue
  style?: ViewStyle
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

const $label: ViewStyle = {
  alignItems: "center",
  borderWidth: 1,
  backgroundColor: Colors.white,
  borderRadius: Spacing.extraSmall,
  borderColor: Colors.darkGrey,
  justifyContent: "center",
  paddingHorizontal: Spacing.extraSmall,
  paddingVertical: Spacing.tiny,
}

const $text: TextStyle = {
  color: Colors.lightDark,
  lineHeight: Spacing.medium,
}
