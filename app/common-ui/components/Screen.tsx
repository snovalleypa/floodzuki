import React from "react"
import { View, ScrollView, ViewProps, ScrollViewProps, ViewStyle } from "react-native"
import { Edge, SafeAreaView } from "react-native-safe-area-context"

import { Colors } from "@common-ui/constants/colors"
import { Spacing } from "@common-ui/constants/spacing"
import { OffsetProps, useOffsetStyles } from "@common-ui/utils/useOffset"
import WebFooter from "@components/WebFooter"

export type ContentProps = {
  children: React.ReactNode
  padding?: number
  noPadding?: boolean
  noBackground?: boolean
  bgColor?: string
  style?: ViewStyle
  scrollViewStyle?: ScrollViewProps
  scrollable?: boolean
  onScroll?: ScrollViewProps["onScroll"]
  maxWidth?: number
} & OffsetProps & ViewProps &
  ScrollViewProps

/**
 * Generic Content wrapper for Screens with default padding. It can either be scrollable or not.
 * @param {React.ReactNode} children - content to wrap
 * @param {boolean} noPadding - disable inner padding (default false)
 * @param {boolean} noBackground - disable default background color (defaults to gray)
 * @param {string} bgColor - set background color
 * @param {ViewStyle} style - extra styles for the non-scrollable <Content />
 * @param {ScrollViewProps} scrollViewStyle - extra styles for the scrollable <Content />
 * @param {boolean} scrollable - whether the content is scrollable or not
 * @param {number} maxWidth - max width of the content, when appied - content will be centered horizontally
 * @example
 * <Content scrollable>
 *   <Text>Some content</Text>
 * </Content>
 */
export const Content = (props: ContentProps) => {
  const { children, noPadding, noBackground, bgColor, style, scrollViewStyle, scrollable, maxWidth, onScroll, ...rest } =
    props

  const Container = scrollable ? ScrollView : View

  const holderStyles: ViewStyle[] = useOffsetStyles([$content], rest)
  const scrollStyles: ViewStyle[] = [$scrollView]

  if (noBackground) {
    holderStyles.push($noBackground)
    scrollStyles.push($noBackground)
  }

  if (bgColor) {
    holderStyles.push({ backgroundColor: bgColor })
    scrollStyles.push({ backgroundColor: bgColor })
  }

  if (noPadding) {
    holderStyles.push($noPadding)
    scrollStyles.push($noPadding)
  }

  if (style) {
    holderStyles.push(style)
  }

  if (maxWidth) {
    holderStyles.push({ maxWidth, width: "100%", alignSelf: "center" })
  }

  if (scrollViewStyle) {
    scrollStyles.push(scrollViewStyle)
  }

  return (
    <Container
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      scrollEventThrottle={16}
      onScroll={onScroll}
      overScrollMode="never"
      style={scrollStyles}>
      <View style={holderStyles} {...rest}>
        {children}
      </View>
      <WebFooter />
    </Container>
  )
}

/**
 * Screen - generic wrapper for screens. Includes SafeAreaView and ErrorBoundary
 * @param {React.ReactNode} children - inner content for Screen component
 * @param {string} bgColor - set background color
 * @param {Edge[]} edges - edges to apply SafeAreaView to
 * @example
 * <Screen>
 *  <Content>
 *    <Text>Some Text</Text>
 *  </Content>
 * </Screen>
 */
export const Screen = (props: { children: React.ReactNode, bgColor?: string, edges?: Edge[] }) => {
  const { children, bgColor, edges } = props

  const styles = [$container]

  if (bgColor) {
    styles.push({ backgroundColor: bgColor })
  }

  const safeAreaEdges = edges || ["top", "right", "left"]

  return (
    <SafeAreaView edges={safeAreaEdges} style={styles}>
      <View style={$maxWidthHolder}>
        {children}
      </View>
    </SafeAreaView>
  )
}

const $container: ViewStyle = {
  flex: 1,
  backgroundColor: Colors.background,
}

const $content: ViewStyle = {
  flex: 1,
  padding: Spacing.medium,
  backgroundColor: Colors.background,
}

const $scrollView: ViewStyle = {
  flex: 1,
  backgroundColor: Colors.background,
}

const $noBackground: ViewStyle = {
  backgroundColor: Colors.transparent,
}

const $noPadding: ViewStyle = {
  paddingTop: 0,
  paddingBottom: 0,
  paddingLeft: 0,
  paddingRight: 0,
}

const $maxWidthHolder: ViewStyle = {
  flex: 1,
  width: "100%",
  maxWidth: Spacing.desktopLargeWidth,
  alignSelf: "center",
}
