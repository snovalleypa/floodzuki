import React, { useMemo } from "react"
import { ColorValue, ViewStyle, TextStyle, View } from "react-native"
import { Colors, ColorTypes, Palette } from "@common-ui/constants/colors"
import { Spacing } from "@common-ui/constants/spacing"
import { OffsetProps, useOffsetStyles } from "@common-ui/utils/useOffset"
import { LabelText } from "./Text"

type labelProps = {
  text: string
  type?: keyof typeof ColorTypes
  randomBgColor?: boolean
  textColor?: ColorValue
  backgroundColor?: ColorValue
  style?: ViewStyle
} & OffsetProps

const RANDOM_BG_COLORS = [
  Palette.blue800,
  Palette.green800,
  Palette.red800,
  Palette.yellow800,
  Palette.pink800,
]

/**
 * A label component useful to drive attention to some texts (mostly statuses)
 * @param {string} text - Text to display in the label
 * @param {keyof typeof ColorTypes} type - Type of label to display from the ColorTypes
 * @param {boolean} randomBgColor - Whether to use a random background color
 * @param {ColorValue} textColor - Color of the text
 * @param {ColorValue} backgroundColor - Color of the background
 * @param {ViewStyle} style - Style to apply to the label
 * @param {OffsetProps} offsetProps - Props to apply offsets to the label
 *
 * @example
 * <label text="1" type="primary" small />
 */
export function Label(props: labelProps) {
  const { text, type, randomBgColor, style, textColor, backgroundColor, ...offsetProps } = props

  const randomColor = useMemo(() => RANDOM_BG_COLORS[Math.floor(Math.random() * RANDOM_BG_COLORS.length)], [])

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

  if (randomBgColor) {
    labelStyle.push({ backgroundColor: randomColor })
  }

  if (style) {
    labelStyle.push(style)
  }

  return (
    <View style={labelStyle}>
      <LabelText textStyle={textStyle}>{text}</LabelText>
    </View>
  )
}

const $label: ViewStyle = {
  alignItems: "center",
  borderWidth: 2,
  backgroundColor: Colors.white,
  borderRadius: Spacing.extraLarge,
  borderColor: Colors.dark,
  justifyContent: "center",
  paddingHorizontal: Spacing.small,
  paddingVertical: Spacing.extraSmall,
}

const $text: TextStyle = {
  color: Colors.dark,
  lineHeight: Spacing.medium,
}
