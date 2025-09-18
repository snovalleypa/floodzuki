import React from "react"
import { ActivityIndicator, TouchableOpacity } from "react-native";
import Checkbox from 'expo-checkbox';

import { Cell, Row } from "./Common";
import { RegularText } from "./Text";
import { Spacing } from "@common-ui/constants/spacing";
import { Ternary } from "./Conditional";

type CheckBoxItemProps = {
  value: boolean
  onChange: (value: boolean) => void
  label: string
  disabled?: boolean
  isLoading?: boolean
}

const CheckBoxItem = (props: CheckBoxItemProps): React.ReactElement => {
  const { value, onChange, label, disabled = false, isLoading = false } = props

  const isCheckboxDisabled = disabled || isLoading

  const toggleCheckbox = () => {
    if (isCheckboxDisabled) return

    onChange(!value)
  }

  return (
    <TouchableOpacity disabled={disabled} onPress={toggleCheckbox}>
      <Row flex justify="center" bottom={Spacing.small}>
        <Ternary condition={isLoading}>
          <Cell>
            <ActivityIndicator />
          </Cell>
          <Checkbox
            value={value}
            onValueChange={onChange}
            disabled={disabled}
          />
        </Ternary>
        <Cell left={Spacing.extraSmall} flex>
          <RegularText muted={disabled}>{label}</RegularText>
        </Cell>
      </Row>
    </TouchableOpacity>
  )
}

export default CheckBoxItem
