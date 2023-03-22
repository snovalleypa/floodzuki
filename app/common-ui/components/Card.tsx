import React from "react"
import { View, ViewStyle, ColorValue } from "react-native"
import { Colors, ColorTypes } from "@common-ui/constants/colors"
import { OffsetProps, useOffsetStyles } from "@common-ui/utils/useOffset"
import { Spacing } from "@common-ui/constants/spacing"

type CardProps = {
  children: React.ReactNode
  noBackground?: boolean
  type?: keyof typeof ColorTypes
  outline?: boolean
  backgroundColor?: ColorValue
  noPadding?: boolean
  flex?: boolean
} & OffsetProps

type BaseProps = {
  baseStyle: ViewStyle
} & CardProps

const Base = (props: BaseProps): React.ReactElement => {
  const { children, baseStyle, noBackground, type, outline, backgroundColor, noPadding, flex, ...offsetProps } =
    props
  let style: ViewStyle[] = [baseStyle]

  style = useOffsetStyles(style, offsetProps)

  if (noBackground) {
    style.push($noBackground)
  }

  if (noPadding) {
    style.push($noPadding)
  }

  if (flex) {
    style.push($flex)
  }

  if (type || backgroundColor) {
    const color: ColorValue | undefined = type ? Colors[type] : backgroundColor

    if (!outline) {
      style.push({ backgroundColor: color })
    }
    else {
      style.push({ borderColor: color })
    }
  }

  return <View style={style}>{children}</View>
}

/**
 * A Card component useful to display content in a card like structure
 * @param {React.ReactNode} children - Children to display in the card
 * @param {boolean} nonElevated - Whether the card should not be elevated (no shadow displayed)
 * @param {boolean} noBackground - Whether the card should have a background
 * @param {keyof typeof ColorTypes} type - Type of card to display from the ColorTypes
 * @param {boolean} outline - Whether the card should be outlined or filled
 * @param {ColorValue} backgroundColor - Color of the background (default white)
 * @param {boolean} noPadding - Whether the card should have padding (default true)
 * @param {OffsetProps} offsetProps - Props to apply offsets to the card
 * @param {boolean} flex - Whether the card should be flex (default false)
 * @example
 * <Card type="primary" elevated>
 *  <Text>Some content</Text>
 * </Card>
 */
export function Card({ children, ...props }: CardProps) {
  return (
    <Base baseStyle={$card} {...props}>
      {children}
    </Base>
  )
}

const $card: ViewStyle = {
  backgroundColor: Colors.white,
  borderRadius: Spacing.extraSmall,
  borderWidth: 2,
  borderColor: Colors.lightGrey,
  padding: Spacing.small,
  shadowColor: Colors.midGrey,
  shadowOpacity: 0.2,
  shadowRadius: 1,
  elevation: 2,
  shadowOffset: {
    width: 0,
    height: 1,
  },
}

const $noBackground: ViewStyle = {
  backgroundColor: "transparent",
}

const $noPadding: ViewStyle = {
  paddingLeft: 0,
  paddingRight: 0,
  paddingTop: 0,
  paddingBottom: 0,
}

const $flex: ViewStyle = {
  flex: 1,
}
