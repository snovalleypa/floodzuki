import React from "react"

import { ColorValue, TextStyle } from "react-native"

import { Feather } from "@expo/vector-icons"

import { OffsetProps, useOffsetStyles } from "@common-ui/utils/useOffset"
import { Spacing } from "@common-ui/constants/spacing"

type IconProps = {
  name: keyof typeof Feather.glyphMap
  size?: number
  color?: ColorValue
  style?: TextStyle
} & OffsetProps

/**
 * Icon - is a common component to use icons in the app. It is based on Feather https://materialdesignicons.com/
 * @param {keyof typeof Feather.glyphMap} name - icon name
 * @param {number} size - size of the icon
 * @param {string} color - color of the icon
 * @example
 * <Icon name="alien-outline" size={24} />
 */
export default function Icon({ name, size, color, style, ...props }: IconProps) {
  const styles = useOffsetStyles([style], props)

  return <Feather
    name={name}
    size={size || Spacing.large}
    color={color}
    style={styles} />
}
