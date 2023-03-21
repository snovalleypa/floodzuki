import React from "react"
import { ColorValue, View, ViewStyle } from "react-native"

import { Colors } from "@common-ui/constants/colors"
import { Spacing } from "@common-ui/constants/spacing"
import { OffsetProps, useOffsetStyles } from "@common-ui/utils/useOffset"
import { If } from "./Conditional"

type RowProps = {
  children?: React.ReactNode
  wrap?: boolean
  flex?: boolean
  align?: "center" | "space-between" | "space-around" | "space-evenly" | "flex-start" | "flex-end"
  justify?: "center" | "flex-start" | "flex-end" | "stretch" | "baseline"
} & OffsetProps

type CellProps = {
  children?: React.ReactNode
  flex?: boolean
  align?: "center" | "flex-start" | "flex-end" | "stretch" | "baseline"
  justify?: "center" | "space-between" | "space-around" | "space-evenly" | "flex-start" | "flex-end"
  bgColor?: ColorValue
} & OffsetProps

type BottomContainerProps = {
  children?: React.ReactNode
  withGradient?: boolean
} & OffsetProps

type AbsoluteContainerProps = {
  children?: React.ReactNode
  sticks?: Array<"top" | "bottom" | "left" | "right">
} & OffsetProps

/**
 * Row is a flexbox container that lays out its children in a row.
 * @param {React.ReactNode} children - The children to render.
 * @param {boolean} wrap - Whether to wrap the children if they don't fit in a row.
 * @param {boolean} flex - Whether to use flexbox to layout the children.
 * @param {"center" | "space-between" | "space-around" | "space-evenly" | "flex-start" | "flex-end"} align - How to align the children in the row.
 * @param {"center" | "flex-start" | "flex-end" | "stretch" | "baseline"} justify - How to align vertically the children in the row.
 * @param {OffsetProps} props - The offset props.
 * @example
 * <Row align="space-between">
 *   <Text>Text</Text>
 * </Row>
 */
export const Row = ({ children, align, justify, flex, wrap, ...offsetProps }: RowProps) => {
  let styles: ViewStyle[] = [{ flexDirection: "row", alignItems: "center" }]

  styles = useOffsetStyles(styles, offsetProps)

  if (align) {
    styles.push({ justifyContent: align })
  }

  if (justify) {
    styles.push({ alignItems: justify })
  }

  if (flex) {
    styles.push({ flex: 1 })
  }

  if (wrap) {
    styles.push({ flexWrap: "wrap" })
  }

  return <View style={styles}>{children}</View>
}

/**
 * Separator is a thin horizontal line that can be used to separate content.
 * @example
 * <Separator />
 */
const $seprator = { height: 1, width: "100%", backgroundColor: Colors.lightGrey }
export const Separator = () => <View style={$seprator} />

/**
 * Spacer is an empty block that can be used to add space between content.
 * @param {number} height - The height of the spacer (default 16px).
 * @example
 * <Spacer height={Spacing.medium} />
 */
export const Spacer = ({ height }: { height?: number }) => <View style={{ height: height || Spacing.medium }} />

/**
 * Cell is a flexbox container lays out children in a stack
 * @param {React.ReactNode} children - The children to render.
 * @param {boolean} flex - Whether to use flexbox to layout the children.
 * @param {"center" | "flex-start" | "flex-end" | "stretch" | "baseline"} align - How to align the children in the column.
 * @param {"center" | "space-between" | "space-around" | "space-evenly" | "flex-start" | "flex-end"} justify - How to align the children in the column.
 * @param {ColorValue} bgColor - The background color of the cell.
 * @param {OffsetProps} props - The offset props.
 * @example
 * <Cell align="stretch">
 *   <Text>Text</Text>
 * </Cell>
 */
export const Cell = ({ children, align, justify, flex, bgColor, ...offsetProps }: CellProps) => {
  let styles: ViewStyle[] = [{ flexDirection: "column", justifyContent: "center" }]

  styles = useOffsetStyles(styles, offsetProps)

  if (align) {
    styles.push({ alignItems: align })
  }

  if (justify) {
    styles.push({ justifyContent: justify })
  }

  if (flex) {
    styles.push({ flex: 1 })
  }

  if (bgColor) {
    styles.push({ backgroundColor: bgColor })
  }

  return <View style={styles}>{children}</View>
}


/**
 * BottomContainer is a flexbox container that sticks content to the bottom.
 * @param {React.ReactNode} children - The children to render.
 * @param {boolean} withGradient - Whether to add a gradient to the bottom of the container.
 * @param {OffsetProps} props - The offset props.
 * @example
 * <BottomContainer>
 *  <Text>Text</Text>
 * </BottomContainer>
 */
export const BottomContainer = ({ children, withGradient, ...offsetProps }: BottomContainerProps) => {
  let styles: ViewStyle[] = [$bottomContainer]

  styles = useOffsetStyles(styles, offsetProps)

  return (
    <View style={styles}>
      {children}
    </View>
  )
}

const $bottomContainer: ViewStyle = {
  position: "absolute",
  left: 0,
  right: 0,
  bottom: 0,
}

/**
 * AbsoluteContainer is a flexbox container that sticks content to some direction ("left", "right", "top", "bottom").
 * @param {React.ReactNode} children - The children to render.
 * @param {"left" | "right" | "top" | "bottom"} sticks - The position of the container.
 * @param {OffsetProps} props - The offset props.
 * @example
 * <AbsoluteContainer positions=["right", "top"]>
 *  <Text>Text</Text>
 * </AbsoluteContainer>
 */
export const AbsoluteContainer = ({ children, sticks, ...offsetProps }: AbsoluteContainerProps) => {
  let styles: ViewStyle[] = [{ position: "absolute" }]

  styles = useOffsetStyles(styles, offsetProps)

  if (sticks.includes("left")) {
    styles.push({ left: 0 })
  }

  if (sticks.includes("right")) {
    styles.push({ right: 0 })
  }

  if (sticks.includes("top")) {
    styles.push({ top: 0 })
  }

  if (sticks.includes("bottom")) {
    styles.push({ bottom: 0 })
  }

  return (
    <View style={styles}>
      {children}
    </View>
  )
}
