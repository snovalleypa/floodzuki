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
  height?: number
  width?: number
  minHeight?: number
  minWidth?: number
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
 * @param minHeight - minimum height.
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
  } = props

  if (top) {
    styles.push({ marginTop: top })
  }

  if (left) {
    styles.push({ marginLeft: left })
  }

  if (bottom) {
    styles.push({ marginBottom: bottom })
  }

  if (right) {
    styles.push({ marginRight: right })
  }

  if (vertical) {
    styles.push({ marginTop: vertical, marginBottom: vertical })
  }

  if (horizontal) {
    styles.push({ marginLeft: horizontal, marginRight: horizontal })
  }

  if (innerVertical) {
    styles.push({ paddingTop: innerVertical, paddingBottom: innerVertical })
  }

  if (innerHorizontal) {
    styles.push({ paddingLeft: innerHorizontal, paddingRight: innerHorizontal })
  }

  if (innerTop) {
    styles.push({ paddingTop: innerTop })
  }

  if (innerLeft) {
    styles.push({ paddingLeft: innerLeft })
  }

  if (innerBottom) {
    styles.push({ paddingBottom: innerBottom })
  }

  if (innerRight) {
    styles.push({ paddingRight: innerRight })
  }

  if (height) {
    styles.push({ height })
  }

  if (width) {
    styles.push({ width })
  }

  if (minHeight) {
    styles.push({ minHeight })
  }

  if (minWidth) {
    styles.push({ minWidth })
  }

  return styles
}
