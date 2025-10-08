import { FlexStyle } from "react-native"

export type OffsetProps = {
  top?: number
  left?: number
  bottom?: number
  right?: number
  vertical?: number
  horizontal?: number
  innerVertical?: number
  innerHorizontal?: number
  innerTop?: number
  innerLeft?: number
  innerBottom?: number
  innerRight?: number
  height?: number | string
  width?: number
  minHeight?: number | string
  maxHeight?: number | string
  minWidth?: number | string
  maxWidth?: number | string
}

/**
 * A hook to extend any component with offset styles.
 * @param top - top margin.
 * @param left - left margin.
 * @param bottom - bottom margin.
 * @param right - right margin.
 * @param innerTop - top padding.
 * @param innerLeft - left padding.
 * @param innerBottom - bottom padding.
 * @param innerRight - right padding.
 * @param height - height.
 * @param width - width.
 * @param minWidth - minimum width.
 * @param maxWidth - maximum width.
 * @param minHeight - minimum height.
 * @param maxHeight - maximum height.
 * @returns style - An object containing the applied offset styles.
 * @example
 * const style = useOffsetStyles([], { top: 2, left: 2, bottom: 2, right: 2 })
 */

export function useOffsetStyles(styles: FlexStyle[], props: OffsetProps): Array<FlexStyle> {
  const {
    top,
    left,
    bottom,
    right,
    vertical,
    horizontal,
    innerVertical,
    innerHorizontal,
    innerTop,
    innerLeft,
    innerBottom,
    innerRight,
    height,
    width,
    minHeight,
    minWidth,
    maxWidth,
    maxHeight,
  } = props

  if (props.hasOwnProperty("top")) {
    styles.push({ marginTop: top })
  }

  if (props.hasOwnProperty("left")) {
    styles.push({ marginLeft: left })
  }

  if (props.hasOwnProperty("bottom")) {
    styles.push({ marginBottom: bottom })
  }

  if (props.hasOwnProperty("right")) {
    styles.push({ marginRight: right })
  }

  if (props.hasOwnProperty("vertical")) {
    styles.push({ marginTop: vertical, marginBottom: vertical })
  }

  if (props.hasOwnProperty("horizontal")) {
    styles.push({ marginLeft: horizontal, marginRight: horizontal })
  }

  if (props.hasOwnProperty("innerVertical")) {
    styles.push({ paddingTop: innerVertical, paddingBottom: innerVertical })
  }

  if (props.hasOwnProperty("innerHorizontal")) {
    styles.push({ paddingLeft: innerHorizontal, paddingRight: innerHorizontal })
  }

  if (props.hasOwnProperty("innerTop")) {
    styles.push({ paddingTop: innerTop })
  }

  if (props.hasOwnProperty("innerLeft")) {
    styles.push({ paddingLeft: innerLeft })
  }

  if (props.hasOwnProperty("innerBottom")) {
    styles.push({ paddingBottom: innerBottom })
  }

  if (props.hasOwnProperty("innerRight")) {
    styles.push({ paddingRight: innerRight })
  }

  if (props.hasOwnProperty("height")) {
    styles.push({ height })
  }

  if (props.hasOwnProperty("width")) {
    styles.push({ width })
  }

  if (props.hasOwnProperty("minHeight")) {
    styles.push({ minHeight })
  }

  if (props.hasOwnProperty("minWidth")) {
    styles.push({ minWidth })
  }

  if (props.hasOwnProperty("maxHeight")) {
    styles.push({ maxHeight })
  }

  if (props.hasOwnProperty("maxWidth")) {
    styles.push({ maxWidth })
  }

  return styles
}
