import React, { useEffect, useMemo, useState } from "react"
import { observer } from "mobx-react-lite"

import { LinkButton, SolidButton } from "@common-ui/components/Button"
import { Card, CardContent, CardFooter } from "@common-ui/components/Card"
import { If } from "@common-ui/components/Conditional"
import { MediumText, RegularText } from "@common-ui/components/Text"
import { useStores } from "@models/helpers/useStores"
import { Spacing } from "@common-ui/constants/spacing"

import ErrorMessage from "@common-ui/components/ErrorMessage"
import SuccessMessage from "@common-ui/components/SuccessMessage"
import { Cell, RowOrCell } from "@common-ui/components/Common"
import { Input } from "@common-ui/components/Input"
import { useRouter } from "expo-router"
import { ROUTES } from "app/_layout"
import { useValidations } from "@utils/useValidations"
import Config from "@config/config"

export type PasswordSubmitActionProps = {
  oldPassword: string
  newPassword: string
}

type ChangePasswordFormProps = {
  description?: string
  errorMessage?: string
  successMessage?: string
  showOldPasswordForm?: boolean
  submitAction: (data: PasswordSubmitActionProps) => void
  submitActionText: string
}

const ChangePasswordForm = observer(
  function ChangePasswordForm(props: ChangePasswordFormProps) {
    const { description, errorMessage, successMessage, showOldPasswordForm, submitAction, submitActionText } = props

    const router = useRouter()
    const { authSessionStore } = useStores()

    const [oldPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")

    const [passwordError, setPasswordError] = useState("")

    const fieldsToValidate = useMemo(() => {
      const fields = {
        newPassword,
        confirmPassword,
      }

      if (showOldPasswordForm) {
        fields["oldPassword"] = oldPassword
      }

      return fields
    }, [oldPassword, newPassword, confirmPassword, showOldPasswordForm])

    const [isValid] = useValidations(fieldsToValidate)

    useEffect(() => {
      setPasswordError("")

      // Validate Password
      if (newPassword && newPassword.length < Config.PASSWORD_MIN_LENGTH) {
        setPasswordError(`Password must be at least ${Config.PASSWORD_MIN_LENGTH} characters`)
      }

      // Validate Password Confirmation
      if (newPassword && confirmPassword && confirmPassword !== newPassword) {
        setPasswordError("Passwords do not match")
      }
    }, [oldPassword, newPassword, confirmPassword, showOldPasswordForm])

    const onSumbit = () => {
      if (!isValid || passwordError) return

      submitAction({
        oldPassword,
        newPassword
      })
    }

    const goToHomeScreen = () => {
      router.push({ pathname: ROUTES.Home })
    }

    const error = passwordError || errorMessage

    return (
      <Card>
        <If condition={!!description}>
          <RegularText>{description}</RegularText>
        </If>
        <CardContent>
          <If condition={showOldPasswordForm}>
            <RowOrCell vertical={Spacing.small}>
              <Cell flex={1}>
                <MediumText>Current Password:</MediumText>
              </Cell>
              <Cell flex={4}>
                <Input
                  value=""
                  secureTextEntry
                  placeholder="Current Password"
                  onChangeText={setCurrentPassword}
                />
              </Cell>
            </RowOrCell>
          </If>
          <RowOrCell vertical={Spacing.small}>
            <Cell flex={1}>
              <MediumText>New Password:</MediumText>
            </Cell>
            <Cell flex={4}>
              <Input
                value=""
                secureTextEntry
                placeholder="New Password"
                onChangeText={setNewPassword}
              />
            </Cell>
          </RowOrCell>
          <RowOrCell vertical={Spacing.small}>
            <Cell flex={1}>
              <MediumText>Confirm Password:</MediumText>
            </Cell>
            <Cell flex={4}>
              <Input
                value=""
                secureTextEntry
                placeholder="Confirm Password"
                onChangeText={setConfirmPassword}
              />
            </Cell>
          </RowOrCell>
          <If condition={!!error}>
            <ErrorMessage errorText={error} />
          </If>
          <If condition={!!successMessage && !error}>
            <SuccessMessage successText={successMessage} />
            <LinkButton
              selfAlign="center"
              title="Click here to proceed to Floodzilla"
              onPress={goToHomeScreen}
            />
          </If>
        </CardContent>
        <CardFooter>
          <SolidButton
            disabled={!isValid || !!passwordError}
            isLoading={authSessionStore.isFetching}
            minWidth={Spacing.extraExtraHuge}
            selfAlign="center"
            title={submitActionText}
            onPress={onSumbit}
          />
        </CardFooter>
      </Card>
    )
  }
)

export default ChangePasswordForm
