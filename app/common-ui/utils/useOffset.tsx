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

  if (Object.hasOwn(props, "top")) {
    styles.push({ marginTop: top })
  }

  if (Object.hasOwn(props, "left")) {
    styles.push({ marginLeft: left })
  }

  if (Object.hasOwn(props, "bottom")) {
    styles.push({ marginBottom: bottom })
  }

  if (Object.hasOwn(props, "right")) {
    styles.push({ marginRight: right })
  }

  if (Object.hasOwn(props, "vertical")) {
    styles.push({ marginTop: vertical, marginBottom: vertical })
  }

  if (Object.hasOwn(props, "horizontal")) {
    styles.push({ marginLeft: horizontal, marginRight: horizontal })
  }

  if (Object.hasOwn(props, "innerVertical")) {
    styles.push({ paddingTop: innerVertical, paddingBottom: innerVertical })
  }

  if (Object.hasOwn(props, "innerHorizontal")) {
    styles.push({ paddingLeft: innerHorizontal, paddingRight: innerHorizontal })
  }

  if (Object.hasOwn(props, "innerTop")) {
    styles.push({ paddingTop: innerTop })
  }

  if (Object.hasOwn(props, "innerLeft")) {
    styles.push({ paddingLeft: innerLeft })
  }

  if (Object.hasOwn(props, "innerBottom")) {
    styles.push({ paddingBottom: innerBottom })
  }

  if (Object.hasOwn(props, "innerRight")) {
    styles.push({ paddingRight: innerRight })
  }

  if (Object.hasOwn(props, "height")) {
    styles.push({ height })
  }

  if (Object.hasOwn(props, "width")) {
    styles.push({ width })
  }

  if (Object.hasOwn(props, "minHeight")) {
    styles.push({ minHeight })
  }

  if (Object.hasOwn(props, "minWidth")) {
    styles.push({ minWidth })
  }

  if (Object.hasOwn(props, "maxHeight")) {
    styles.push({ maxHeight })
  }

  if (Object.hasOwn(props, "maxWidth")) {
    styles.push({ maxWidth })
  }

  return styles
}
