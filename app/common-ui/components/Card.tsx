import React from "react"
import { View, ViewStyle, ColorValue } from "react-native"
import { Colors, ColorTypes } from "@common-ui/constants/colors"
import { OffsetProps, useOffsetStyles } from "@common-ui/utils/useOffset"
import { Spacing } from "@common-ui/constants/spacing"
import { Cell, Row, Separator } from "./Common"
import { If } from "./Conditional"

type CardProps = {
  children: React.ReactNode
  noBackground?: boolean
  type?: keyof typeof ColorTypes
  outline?: boolean
  backgroundColor?: ColorValue
  noPadding?: boolean
  flex?: boolean | number | string
} & OffsetProps

type CardItemProps = {
  children: [JSX.Element, JSX.Element]
  noBorder?: boolean
}

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
    const flexValue = typeof flex === "boolean" ? 1 : flex
    style.push({ flex: flexValue })
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
 * @param {boolean} noBackground - Whether the card should have a background
 * @param {keyof typeof ColorTypes} type - Type of card to display from the ColorTypes
 * @param {boolean} outline - Whether the card should be outlined or filled
 * @param {ColorValue} backgroundColor - Color of the background (default white)
 * @param {boolean} noPadding - Whether the card should have padding (default true)
 * @param {OffsetProps} offsetProps - Props to apply offsets to the card
 * @param {boolean | number} flex - Whether the card should be flex (default false)
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


/**
 * A Card Header component useful to display content in a card like structure
 * @param {React.ReactNode} children - Children to display in the card
 * @param {keyof typeof ColorTypes} type - Type of card to display from the ColorTypes
 * @param {boolean} outline - Whether the card should be outlined or filled
 * @param {ColorValue} backgroundColor - Color of the background (default white)
 * @param {boolean} noPadding - Whether the card should have padding (default true)
 * @param {OffsetProps} offsetProps - Props to apply offsets to the card
 * @param {boolean | number} flex - Whether the card should be flex (default false)
 * @example
 * <Card type="primary">
 *  <CardHeader>
 *    <Text>Some content</Text>
 *  </CardHeader>
 * </Card>
 */
export function CardHeader({ children, ...props }: CardProps) {
  return (
    <Base baseStyle={$cardHeader} {...props}>
      {children}
    </Base>
  )
}

/**
 * A Card Footer component useful to display content in a card like structure
 * @param {React.ReactNode} children - Children to display in the card
 * @param {keyof typeof ColorTypes} type - Type of card to display from the ColorTypes
 * @param {boolean} outline - Whether the card should be outlined or filled
 * @param {ColorValue} backgroundColor - Color of the background (default white)
 * @param {boolean} noPadding - Whether the card should have padding (default true)
 * @param {OffsetProps} offsetProps - Props to apply offsets to the card
 * @param {boolean | number} flex - Whether the card should be flex (default false)
 * @example
 * <Card type="primary">
 *  <CardFooter>
 *    <Text>Some content</Text>
 *  </CardFooter>
 * </Card>
 */
export function CardFooter({ children, ...props }: CardProps) {
  return (
    <Base baseStyle={$cardFooter} {...props}>
      {children}
    </Base>
  )
}

export function CardItem({ children, noBorder = false }: CardItemProps) {
  return (
    <Cell
      horizontal={-Spacing.small}
    >
      <Row
        align="space-between"
        horizontal={Spacing.small}
        vertical={Spacing.small}
      >
        {children[0]}
        {children[1]}
      </Row>
      <If condition={!noBorder}>
        <Separator />
      </If>
    </Cell>
  )
}

const $card: ViewStyle = {
  backgroundColor: Colors.white,
  borderRadius: Spacing.extraSmall,
  borderWidth: 1,
  borderColor: Colors.lightGrey,
  padding: Spacing.small,
  shadowColor: Colors.midGrey,
  shadowOpacity: 0.25,
  shadowRadius: 1,
  elevation: 2,
  shadowOffset: {
    width: 0,
    height: 1,
  },
}

const $cardHeader: ViewStyle = {
  backgroundColor: Colors.white,
  borderTopLeftRadius: Spacing.extraSmall,
  borderTopRightRadius: Spacing.extraSmall,
  borderBottomWidth: 1,
  borderBottomColor: Colors.lightGrey,
  paddingBottom: Spacing.small,
  marginHorizontal: -Spacing.small,
  paddingHorizontal: Spacing.small,
}

const $cardFooter: ViewStyle = {
  backgroundColor: Colors.white,
  borderBottomLeftRadius: Spacing.extraSmall,
  borderBottomRightRadius: Spacing.extraSmall,
  borderTopWidth: 1,
  borderTopColor: Colors.lightGrey,
  paddingTop: Spacing.small,
  marginHorizontal: -Spacing.small,
  paddingHorizontal: Spacing.small,
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
