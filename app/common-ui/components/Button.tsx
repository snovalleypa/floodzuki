import React from "react"
import {
  ColorValue,
  TouchableOpacityProps,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View
} from "react-native"
import { RectButton, BorderlessButton } from "react-native-gesture-handler"
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated"

import { Feather } from "@expo/vector-icons"
import { MediumText } from "./Text"

import { Colors, ColorTypes } from "@common-ui/constants/colors"
import { Spacing } from "@common-ui/constants/spacing"
import { If } from "@common-ui/components/Conditional"
import { OffsetProps, useOffsetStyles } from "@common-ui/utils/useOffset"
import { Timing } from "@common-ui/constants/timing"

type BaseButtonProps = {
  title?: string
  icon?: keyof typeof Feather.glyphMap
  iconSize?: number
  onPress: () => void
  loadingTitle?: string
  disabled?: boolean
  isLoading?: boolean
  fullWidth?: boolean
  large?: boolean
  small?: boolean
  leftIcon?: keyof typeof Feather.glyphMap
  leftIconSize?: number
  rightIcon?: keyof typeof Feather.glyphMap
  rightIconSize?: number
  textColor?: ColorValue
  backgroundColor?: ColorValue
  borderColor?: ColorValue
  borderRadius?: number
  paddingHorizontal?: number
  align?: "left" | "right"
  shadowOffsetRight?: number
  shadowOffsetBottom?: number
  mode?: "rect" | "borderless"
} & TouchableOpacityProps &
  OffsetProps

type ButtonProps = BaseButtonProps & {
  type?: keyof typeof ColorTypes
}

const TIMING_CONFIG = {
  duration: Timing.fast,
  easing: Easing.out(Easing.exp)
}

function BaseButton(props: BaseButtonProps) {
  const {
    title,
    icon,
    iconSize = Spacing.medium,
    loadingTitle,
    onPress,
    disabled,
    isLoading,
    leftIcon,
    leftIconSize = Spacing.medium,
    rightIcon,
    rightIconSize = Spacing.medium,
    textColor,
    backgroundColor,
    borderColor,
    borderRadius,
    paddingHorizontal,
    fullWidth,
    large,
    small,
    align,
    shadowOffsetRight,
    shadowOffsetBottom,
    mode,
    ...offsetProps
  } = props

  const loadingText = loadingTitle || "Loading..."
  const buttonText = isLoading ? loadingText : title

  const isButtonDisabled = disabled || isLoading

  let buttonStyle: ViewStyle[] = [$button]
  const textStyle: TextStyle[] = [$buttonText]

  buttonStyle = useOffsetStyles(buttonStyle, offsetProps)

  if (backgroundColor) {
    buttonStyle.push({ backgroundColor })
  }

  if (textColor) {
    textStyle.push({ color: textColor })
  }

  if (borderColor) {
    buttonStyle.push({ borderColor })
  }

  if (fullWidth) {
    buttonStyle.push($fullWidth)
  }

  if (large) {
    buttonStyle.push($largeButton)
    textStyle.push($largeButtonText)
  }

  if (small) {
    buttonStyle.push($smallButton)
    textStyle.push($smallButtonText)
  }

  if (leftIcon) {
    buttonStyle.push($noLeftPadding)
  }

  if (rightIcon) {
    buttonStyle.push($noRightPadding)
  }

  if (disabled) {
    buttonStyle.push($buttonDisabled)
  }

  if (align) {
    buttonStyle.push(align === "left" ? $alignLeft : $alignRight)
  }

  if (borderRadius) {
    buttonStyle.push({ borderRadius })
  }

  if (paddingHorizontal) {
    buttonStyle.push({ paddingHorizontal })
  }

  return (
    <RectButton
      enabled={!isButtonDisabled}
      onPress={onPress}
      underlayColor={Colors.transparent}
    >
      <View
        style={buttonStyle}
        accessible
        accessibilityRole="button"
        accessibilityLabel={buttonText}
      >
        <If condition={!!leftIcon}>
          <Feather size={leftIconSize} name={leftIcon} color={textColor} style={$leftIcon} />
        </If>
        <If condition={!!isLoading}>
          <ActivityIndicator size="small" color={textColor} style={$activityIndicator} />
        </If>
        <If condition={!!title}>
          <MediumText textStyle={textStyle}>{buttonText}</MediumText>
        </If>
        <If condition={!!icon}>
          <Feather size={iconSize} name={icon} color={textColor} textStyle={$icon} />
        </If>
        <If condition={!!rightIcon}>
          <Feather size={rightIconSize} name={rightIcon} color={textColor} style={$rightIcon} />
        </If>
      </View>
    </RectButton>
  )
}

/**
 * SolidButton component - a button with a solid background color, used for primary actions
 * @param {string} title - the text to display on the button
 * @param {string} icon - the name of the icon to display on the button (from MaterialCommunityIcons)
 * @param {number} iconSize - the size of the icon to display on the button
 * @param {function} onPress - the function to call when the button is pressed
 * @param {string} loadingTitle - the text to display on the button while it is loading
 * @param {boolean} disabled - whether the button is disabled
 * @param {boolean} isLoading - whether the button is loading
 * @param {boolean} fullWidth - whether the button should take up the full width of its container
 * @param {boolean} large - whether the button should be large (height 54px), default 44px
 * @param {boolean} small - whether the button should be small (height 32px), default 44px
 * @param {string} leftIcon - the name of the icon to display on the left side of the button (from MaterialCommunityIcons)
 * @param {number} leftIconSize - the size of the icon to display on the left side of the button
 * @param {string} rightIcon - the name of the icon to display on the right side of the button (from MaterialCommunityIcons)
 * @param {number} rightIconSize - the size of the icon to display on the right side of the button
 * @param {string} textColor - the color of the text on the button
 * @param {string} backgroundColor - the background color of the button
 * @param {string} borderColor - the border color of the button
 * @param {string} align - the alignment of the button text ("left" or "right")
 * @param {OffsetProps} offsetProps - the offset props to apply to the button
 * @example
 * <SolidButton title="Primary Button" onPress={pressHandler} />
 */
export function SolidButton(props: ButtonProps) {
  const { type, ...rest } = props

  const backgroundColor = type ? Colors[type] : Colors.primary
  const borderColor = Colors.dark

  return <BaseButton
    backgroundColor={backgroundColor}
    borderColor={borderColor}
    textColor={Colors.white}
    {...rest}
  />
}

/**
 * OutlinedButton component - a button with no background color and a border, used for secondary actions
 * @param {string} title - the text to display on the button
 * @param {string} icon - the name of the icon to display on the button (from MaterialCommunityIcons)
 * @param {number} iconSize - the size of the icon to display on the button
 * @param {function} onPress - the function to call when the button is pressed
 * @param {string} loadingTitle - the text to display on the button while it is loading
 * @param {boolean} disabled - whether the button is disabled
 * @param {boolean} isLoading - whether the button is loading
 * @param {boolean} fullWidth - whether the button should take up the full width of its container
 * @param {boolean} large - whether the button should be large (height 54px), default 44px
 * @param {boolean} small - whether the button should be small (height 32px), default 44px
 * @param {string} leftIcon - the name of the icon to display on the left side of the button (from MaterialCommunityIcons)
 * @param {number} leftIconSize - the size of the icon to display on the left side of the button
 * @param {string} rightIcon - the name of the icon to display on the right side of the button (from MaterialCommunityIcons)
 * @param {number} rightIconSize - the size of the icon to display on the right side of the button
 * @param {string} textColor - the color of the text on the button
 * @param {string} backgroundColor - the background color of the button
 * @param {string} borderColor - the border color of the button
 * @param {string} align - the alignment of the button text ("left" or "right")
 * @param {OffsetProps} offsetProps - the offset props to apply to the button
 * @example
 * <OutlinedButton title="Secondary Button" onPress={pressHandler} />
 */
export function OutlinedButton(props: ButtonProps) {
  const { disabled, type } = props

  const backgroundColor = disabled && !type ? Colors.lightGrey : Colors.white
  const borderColor = type ? Colors[type] : Colors.dark
  const textColor = type ? Colors[type] : Colors.dark

  return <BaseButton
    backgroundColor={backgroundColor}
    borderColor={borderColor}
    textColor={textColor}
    {...props}
  />
}

/**
 * LinkButton component - a button with no background color and no border, used as a clickable text
 * @param {string} title - the text to display on the button
 * @param {string} icon - the name of the icon to display on the button (from MaterialCommunityIcons)
 * @param {number} iconSize - the size of the icon to display on the button
 * @param {function} onPress - the function to call when the button is pressed
 * @param {string} loadingTitle - the text to display on the button while it is loading
 * @param {boolean} disabled - whether the button is disabled
 * @param {boolean} isLoading - whether the button is loading
 * @param {boolean} fullWidth - whether the button should take up the full width of its container
 * @param {boolean} large - whether the button should be large (height 54px), default 44px
 * @param {boolean} small - whether the button should be small (height 32px), default 44px
 * @param {string} leftIcon - the name of the icon to display on the left side of the button (from MaterialCommunityIcons)
 * @param {number} leftIconSize - the size of the icon to display on the left side of the button
 * @param {string} rightIcon - the name of the icon to display on the right side of the button (from MaterialCommunityIcons)
 * @param {number} rightIconSize - the size of the icon to display on the right side of the button
 * @param {string} textColor - the color of the text on the button
 * @param {string} backgroundColor - the background color of the button
 * @param {string} borderColor - the border color of the button
 * @param {string} align - the alignment of the button text ("left" or "right")
 * @param {OffsetProps} offsetProps - the offset props to apply to the button
 * @example
 * <LinkButton title="Link Button" onPress={pressHandler} />
 */
export function LinkButton(props: ButtonProps) {
  const { type, ...rest } = props

  const textColor = type ? Colors[type] : Colors.primary

  return <BaseButton
    borderColor="transparent"
    backgroundColor="transparent"
    mode="borderless"
    textColor={textColor}
    {...rest}
  />
}


/**
 * IconButton component - a button with no background color and no border, used as a clickable text
 * @param {string} icon - the name of the icon to display on the button (from MaterialCommunityIcons)
 * @param {number} iconSize - the size of the icon to display on the button
 * @param {function} onPress - the function to call when the button is pressed
 * @param {boolean} disabled - whether the button is disabled
 * @param {boolean} isLoading - whether the button is loading
 * @param {boolean} large - whether the button should be large (height 54px), default 44px
 * @param {boolean} small - whether the button should be small (height 32px), default 44px
 * @param {string} textColor - the color of the text on the button
 * @param {string} backgroundColor - the background color of the button
 * @param {string} borderColor - the border color of the button
 * @param {OffsetProps} offsetProps - the offset props to apply to the button
 * @example
 * <IconButton icon="plus" onPress={pressHandler} />
 */
export function IconButton(props: ButtonProps) {
  const { ...rest } = props

  return <BaseButton
    iconSize={Spacing.larger}
    borderRadius={Spacing.button/2}
    paddingHorizontal={Spacing.tiny}
    shadowOffsetRight={1}
    shadowOffsetBottom={2}
    borderColor={Colors.dark}
    {...rest}
  />
}

const $button: ViewStyle = {
  alignItems: "center",
  backgroundColor: Colors.white,
  borderColor: Colors.lightGrey,
  borderRadius: Spacing.medium,
  borderWidth: 0,
  flexDirection: "row",
  height: Spacing.button,
  justifyContent: "center",
  paddingHorizontal: Spacing.medium,
}

const $largeButton: ViewStyle = {
  height: Spacing.huge,
}

const $smallButton: ViewStyle = {
  height: Spacing.larger,
  paddingHorizontal: Spacing.small,
}

const $fullWidth: ViewStyle = {
  flex: 1,
}

const $buttonText: TextStyle = {
  color: Colors.dark,
}

const $largeButtonText: TextStyle = {
  fontSize: Spacing.large,
  lineHeight: Spacing.larger,
}

const $smallButtonText: TextStyle = {
  fontSize: Spacing.small,
}

const $buttonDisabled: ViewStyle = {
  opacity: 0.5,
}

const $icon: TextStyle = {
  color: Colors.white,
}

const $leftIcon: ViewStyle = {
  marginLeft: Spacing.small,
  marginRight: Spacing.tiny,
}

const $rightIcon: ViewStyle = {
  marginLeft: Spacing.tiny,
  marginRight: Spacing.small,
}

const $noLeftPadding: ViewStyle = {
  paddingLeft: 0,
}

const $noRightPadding: ViewStyle = {
  paddingRight: 0,
}

const $activityIndicator: ViewStyle = {
  marginRight: Spacing.small,
}

const $alignLeft: ViewStyle = {
  alignItems: "flex-start",
  paddingLeft: 0,
}

const $alignRight: ViewStyle = {
  alignItems: "flex-end",
  paddingRight: 0,
}
