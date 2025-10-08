import { Colors } from "@common-ui/constants/colors"
import { Spacing } from "@common-ui/constants/spacing"
import React from "react"
import { TextInput } from "react-native"

type InputProps = {
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
  secureTextEntry?: boolean
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad" | "number-pad"
}

export const Input = (props: InputProps): React.ReactElement => {
  const { value, onChangeText, placeholder, secureTextEntry, keyboardType } = props

  return (
    <TextInput
      autoCapitalize="none"
      style={$inputStyle}
      defaultValue={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType}
      placeholderTextColor={Colors.darkGrey}
    />
  )
}

const $inputStyle = {
  height: Spacing.button,
  marginTop: Spacing.tiny,
  borderColor: Colors.lightGrey,
  borderWidth: 1,
  borderRadius: Spacing.tiny,
  paddingHorizontal: Spacing.small,
  paddingVertical: Spacing.tiny,
}
