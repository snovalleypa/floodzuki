import React from "react"
import { TouchableOpacity } from "react-native";
import Checkbox from 'expo-checkbox';

import { Cell, Row } from "./Common";
import { RegularText } from "./Text";
import { Spacing } from "@common-ui/constants/spacing";

type CheckBoxItemProps = {
  value: boolean
  onChange: (value: boolean) => void
  label: string
  disabled?: boolean
}

const CheckBoxItem = (props: CheckBoxItemProps): React.ReactElement => {
  const { value, onChange, label, disabled } = props

  const toggleCheckbox = () => {
    if (disabled) return

    onChange(!value)
  }

  return (
    <TouchableOpacity disabled={disabled} onPress={toggleCheckbox}>
      <Row flex justify="center" bottom={Spacing.small}>
        <Checkbox
          value={value}
          onValueChange={onChange}
          disabled={disabled}
          style={$checkBoxStyle}
        />
        <Cell flex>
          <RegularText muted={disabled}>{label}</RegularText>
        </Cell>
      </Row>
    </TouchableOpacity>
  )
}

const $checkBoxStyle = {
  marginRight: Spacing.extraSmall,
}

export default CheckBoxItem
