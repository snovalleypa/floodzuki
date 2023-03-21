import React from "react"
import { Text, TextProps, TextStyle } from "react-native"
import { Typography } from "@common-ui/constants/typography"
import { OffsetProps, useOffsetStyles } from "@common-ui/utils/useOffset"

type BaseTextProps = {
  text?: string
  color?: string
  align?: "left" | "center" | "right"
  muted?: boolean
  disabled?: boolean
  baseStyle?: TextStyle
  textStyle?: TextStyle[]
} & TextProps &
  OffsetProps

/**
 * @param BaseTextProps
 * @returns Text component
 * @description Generic Text component that can be configured and styled using props
 * avoid using this directly, instead build a component that uses this as a base.
 */

export function BaseText(props: BaseTextProps) {
  const { color, align, muted, disabled, baseStyle, textStyle, text, ...rest } = props

  let styles: TextStyle[] = []

  styles = useOffsetStyles(styles, rest)

  if (baseStyle) {
    styles.push(baseStyle)
  }

  if (color) {
    styles.push({ color })
  }

  if (align) {
    styles.push({ textAlign: align })
  }

  if (muted) {
    styles.push(Typography.mutedText)
  }

  if (disabled) {
    styles.push(Typography.mutedText)
    styles.push(Typography.disabledText)
  }

  if (textStyle) {
    styles = [...styles, ...textStyle]
  }

  return text ? <Text style={styles} {...rest}>{text}</Text> : <Text style={styles} {...rest} />
}

/**
 * @description fontSize: 32; lineHeight: 34; fontWeight: "700"; fontFamily: "Montserrat"; color: Colors.dark;
 * @param {string} color - Color of the text
 * @param {string} align - Alignment of the text ("left" | "center" | "right")
 * @param {boolean} muted - Whether the text should be muted (greyed out)
 * @param {boolean} disabled - Whether the text should be disabled (greyed out and reduced opacity)
 * @param {TextStyle} baseStyle - Base style to apply to the text
 * @param {TextStyle[]} textStyle - Array of styles to apply to the text
 * @param {OffsetProps} offsetProps - Props to apply offsets to the text
 * @example
 * <HugeTitle color={Color.primary} align="center">Huge Title</HugeTitle>
 */
export function HugeTitle(props: BaseTextProps) {
  return <BaseText baseStyle={Typography.hugeTitle} {...props} />
}

/**
 * @description fontSize: 26; lineHeight: 28; fontWeight: "700"; fontFamily: "Montserrat"; color: Colors.dark;
 * @param {string} color - Color of the text
 * @param {string} align - Alignment of the text ("left" | "center" | "right")
 * @param {boolean} muted - Whether the text should be muted (greyed out)
 * @param {boolean} disabled - Whether the text should be disabled (greyed out and reduced opacity)
 * @param {TextStyle} baseStyle - Base style to apply to the text
 * @param {TextStyle[]} textStyle - Array of styles to apply to the text
 * @param {OffsetProps} offsetProps - Props to apply offsets to the text
 * @example
 * <ExtraLargeTitle color={Color.primary} align="center">Huge Title</ExtraLargeTitle>
 */
export function ExtraLargeTitle(props: BaseTextProps) {
  return <BaseText baseStyle={Typography.extraLargeTitle} {...props} />
}

/**
 * @description fontSize: 18; lineHeight: 20; fontWeight: "600"; fontFamily: "Montserrat"; color: Colors.dark;
 * @param {string} color - Color of the text
 * @param {string} align - Alignment of the text ("left" | "center" | "right")
 * @param {boolean} muted - Whether the text should be muted (greyed out)
 * @param {boolean} disabled - Whether the text should be disabled (greyed out and reduced opacity)
 * @param {TextStyle} baseStyle - Base style to apply to the text
 * @param {TextStyle[]} textStyle - Array of styles to apply to the text
 * @param {OffsetProps} offsetProps - Props to apply offsets to the text
 * @example
 * <LargeTitle color={Color.primary} align="center">Large Title</LargeTitle>
 */
export function LargeTitle(props: BaseTextProps) {
  return <BaseText baseStyle={Typography.largeTitle} {...props} />
}

/**
 * @description fontSize: 16; lineHeight: 18; fontWeight: "600"; fontFamily: "Montserrat"; color: Colors.dark;
 * @param {string} color - Color of the text
 * @param {string} align - Alignment of the text ("left" | "center" | "right")
 * @param {boolean} muted - Whether the text should be muted (greyed out)
 * @param {boolean} disabled - Whether the text should be disabled (greyed out and reduced opacity)
 * @param {TextStyle} baseStyle - Base style to apply to the text
 * @param {TextStyle[]} textStyle - Array of styles to apply to the text
 * @param {OffsetProps} offsetProps - Props to apply offsets to the text
 * @example
 * <MediumTitle color={Color.primary} align="center">Medium Title</MediumTitle>
 */
export function MediumTitle(props: BaseTextProps) {
  return <BaseText baseStyle={Typography.mediumTitle} {...props} />
}

/**
 * @description fontSize: 14; lineHeight: 16; fontWeight: "700"; fontFamily: "Montserrat"; color: Colors.dark;
 * @param {string} color - Color of the text
 * @param {string} align - Alignment of the text ("left" | "center" | "right")
 * @param {boolean} muted - Whether the text should be muted (greyed out)
 * @param {boolean} disabled - Whether the text should be disabled (greyed out and reduced opacity)
 * @param {TextStyle} baseStyle - Base style to apply to the text
 * @param {TextStyle[]} textStyle - Array of styles to apply to the text
 * @param {OffsetProps} offsetProps - Props to apply offsets to the text
 * @example
 * <SmallTitle color={Color.primary} align="center">Small Title</SmallTitle>
 */
export function SmallTitle(props: BaseTextProps) {
  return <BaseText baseStyle={Typography.smallTitle} {...props} />
}

/**
 * @description fontSize: 16; lineHeight: 18; fontWeight: "400"; fontFamily: "OpenSans"; color: Colors.dark;
 * @param {string} color - Color of the text
 * @param {string} align - Alignment of the text ("left" | "center" | "right")
 * @param {boolean} muted - Whether the text should be muted (greyed out)
 * @param {boolean} disabled - Whether the text should be disabled (greyed out and reduced opacity)
 * @param {TextStyle} baseStyle - Base style to apply to the text
 * @param {TextStyle[]} textStyle - Array of styles to apply to the text
 * @param {OffsetProps} offsetProps - Props to apply offsets to the text
 * @example
 * <RegularLargeText color={Color.primary} align="left">Regular Large Text</RegularLargeText>
 */
export function RegularLargeText(props: BaseTextProps) {
  return <BaseText baseStyle={Typography.regularLargeText} {...props} />
}

/**
 * @description fontSize: 14; lineHeight: 16; fontWeight: "400"; fontFamily: "OpenSans"; color: Colors.dark;
 * @param {string} color - Color of the text
 * @param {string} align - Alignment of the text ("left" | "center" | "right")
 * @param {boolean} muted - Whether the text should be muted (greyed out)
 * @param {boolean} disabled - Whether the text should be disabled (greyed out and reduced opacity)
 * @param {TextStyle} baseStyle - Base style to apply to the text
 * @param {TextStyle[]} textStyle - Array of styles to apply to the text
 * @param {OffsetProps} offsetProps - Props to apply offsets to the text
 * @example
 * <MediumText color={Color.primary} align="center">Medium Text</MediumText>
 */
export function MediumText(props: BaseTextProps) {
  return <BaseText baseStyle={Typography.mediumText} {...props} />
}

/**
 * @description fontSize: 14; lineHeight: 16; fontWeight: "300"; fontFamily: "OpenSans"; color: Colors.dark;
 * @param {string} color - Color of the text
 * @param {string} align - Alignment of the text ("left" | "center" | "right")
 * @param {boolean} muted - Whether the text should be muted (greyed out)
 * @param {boolean} disabled - Whether the text should be disabled (greyed out and reduced opacity)
 * @param {TextStyle} baseStyle - Base style to apply to the text
 * @param {TextStyle[]} textStyle - Array of styles to apply to the text
 * @param {OffsetProps} offsetProps - Props to apply offsets to the text
 * @example
 * <RegularText color={Color.primary} align="center">Regular Text</RegularText>
 */
export function RegularText(props: BaseTextProps) {
  return <BaseText baseStyle={Typography.regularText} {...props} />
}

/**
 * @description fontSize: 12; lineHeight: 14; fontWeight: "300"; fontFamily: "OpenSans"; color: Colors.dark;
 * @param {string} color - Color of the text
 * @param {string} align - Alignment of the text ("left" | "center" | "right")
 * @param {boolean} muted - Whether the text should be muted (greyed out)
 * @param {boolean} disabled - Whether the text should be disabled (greyed out and reduced opacity)
 * @param {TextStyle} baseStyle - Base style to apply to the text
 * @param {TextStyle[]} textStyle - Array of styles to apply to the text
 * @param {OffsetProps} offsetProps - Props to apply offsets to the text
 * @example
 * <SmallerText color={Color.primary} align="center">Smaller Text</SmallerText>
 */
export function SmallerText(props: BaseTextProps) {
  return <BaseText baseStyle={Typography.smallerText} {...props} />
}

/**
 * @description fontSize: 10; lineHeight: 12; fontWeight: "300"; fontFamily: "OpenSans"; color: Colors.dark;
 * @param {string} color - Color of the text
 * @param {string} align - Alignment of the text ("left" | "center" | "right")
 * @param {boolean} muted - Whether the text should be muted (greyed out)
 * @param {boolean} disabled - Whether the text should be disabled (greyed out and reduced opacity)
 * @param {TextStyle} baseStyle - Base style to apply to the text
 * @param {TextStyle[]} textStyle - Array of styles to apply to the text
 * @param {OffsetProps} offsetProps - Props to apply offsets to the text
 * @example
 * <SmallText color={Color.primary} align="center">Small Text</SmallText>
 */
export function SmallText(props: BaseTextProps) {
  return <BaseText baseStyle={Typography.smallText} {...props} />
}

/**
 * @description fontSize: 8; lineHeight: 10; fontWeight: "300"; fontFamily: "OpenSans"; color: Colors.dark;
 * @param {string} color - Color of the text
 * @param {string} align - Alignment of the text ("left" | "center" | "right")
 * @param {boolean} muted - Whether the text should be muted (greyed out)
 * @param {boolean} disabled - Whether the text should be disabled (greyed out and reduced opacity)
 * @param {TextStyle} baseStyle - Base style to apply to the text
 * @param {TextStyle[]} textStyle - Array of styles to apply to the text
 * @param {OffsetProps} offsetProps - Props to apply offsets to the text
 * @example
 * <TinyText color={Color.primary} align="center">Tiny Text</TinyText>
 */
export function TinyText(props: BaseTextProps) {
  return <BaseText baseStyle={Typography.tinyText} {...props} />
}

/**
 * @description fontSize: 12; lineHeight: 14; fontWeight: "700"; fontFamily: "OpenSans"; color: Colors.lightDark;
 * @param {string} color - Color of the text
 * @param {string} align - Alignment of the text ("left" | "center" | "right")
 * @param {boolean} muted - Whether the text should be muted (greyed out)
 * @param {boolean} disabled - Whether the text should be disabled (greyed out and reduced opacity)
 * @param {TextStyle} baseStyle - Base style to apply to the text
 * @param {TextStyle[]} textStyle - Array of styles to apply to the text
 * @param {OffsetProps} offsetProps - Props to apply offsets to the text
 * @example
 * <LabelText color={Color.primary} align="center">Label Text</LabelText>
 */
export function LabelText(props: BaseTextProps) {
  return <BaseText baseStyle={Typography.labelText} {...props} />
}
