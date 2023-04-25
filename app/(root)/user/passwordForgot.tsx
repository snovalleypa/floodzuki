import React, { useEffect, useMemo, useRef, useState } from "react"
import { ErrorBoundaryProps, Stack, useRouter } from "expo-router"
import { t } from "@i18n/translate"

import { Screen, Content } from "@common-ui/components/Screen"
import { MediumText, RegularText } from "@common-ui/components/Text"
import { ErrorDetails } from "@components/ErrorDetails"
import TitleWithBackButton from "@components/TitleWithBackButton"
import { ROUTES } from "app/_layout"
import { Spacing } from "@common-ui/constants/spacing"
import { Card, CardContent } from "@common-ui/components/Card"
import { Cell, Row, RowOrCell } from "@common-ui/components/Common"
import { Input } from "@common-ui/components/Input"
import { SolidButton } from "@common-ui/components/Button"
import { observer } from "mobx-react-lite"
import { useStores } from "@models/helpers/useStores"
import GoogleRecaptcha from "@components/GoogleRecaptcha"
import { If } from "@common-ui/components/Conditional"
import ErrorMessage from "@common-ui/components/ErrorMessage"
import { useValidations } from "@utils/useValidations"

// We use this to wrap each screen with an error boundary
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorDetails {...props} />;
}

const PasswordForgotScreen = observer(
  function PasswordForgotScreen() {
    const router = useRouter()
    const { authSessionStore } = useStores()

    const recaptcha = useRef(null)

    const [email, setEmail] = useState("")
    const [emailSent, setEmailSent] = useState(false)

    const fieldsToValidate = useMemo(
      () => ({ email })
    , [email])
    const [isValid] = useValidations(fieldsToValidate)

    // Clear any errors when the screen is loaded
    useEffect(() => {
      authSessionStore.clearDataFetching()
    }, [])

    const forgotPassword = async (captchaToken: string) => {
      await authSessionStore.forgotPassword({
        email,
        captchaToken
      })

      setEmailSent(true)

      recaptcha.current?.reset();
    }

    const submit = () => {
      if (!isValid) return
      
      recaptcha.current?.reset();
      recaptcha.current?.open();
    }

    const onVerify = (captchaToken: string) => {
      forgotPassword(captchaToken)
    }
    
    // This is called when the recaptcha expires
    const onExpire = () => {
      recaptcha.current?.open();
    }

    const goBack = () => {
      router.push({ pathname: ROUTES.UserLogin })
    }

    const text = emailSent && !authSessionStore.isError ?
      `An email has been sent to ${email} with a link to reset your password.\nIf there is no matching account 
      no email will be sent.` :
      "Enter your email address. We will send you a link to allow you to reset your password."

    return (
      <Screen>
        <Stack.Screen options={{ title: `${t("common.title")} - ${t("homeScreen.title")}` }} />
        <TitleWithBackButton
          title={t("navigation.passwordForgotScreen")}
          onPress={goBack}
        />
        <Content maxWidth={Spacing.tabletWidth} scrollable>
          <Card bottom={Spacing.large}>
            <GoogleRecaptcha
              ref={recaptcha}
              onVerify={onVerify}
              onExpire={onExpire}
            />
            <CardContent>
              <RegularText lineHeight={Spacing.large}>
                {text}
              </RegularText>
              <RowOrCell vertical={Spacing.small}>
                <Cell flex={1}>
                  <MediumText>Email</MediumText>
                </Cell>
                <Cell flex={5}>
                  <Input
                    value=""
                    placeholder="Enter your email"
                    onChangeText={setEmail}
                  />
                </Cell>
              </RowOrCell>
              <If condition={authSessionStore.isError}>
                <ErrorMessage errorText={authSessionStore.errorMessage} />
              </If>
              <Row align="space-evenly" top={Spacing.small} bottom={Spacing.large}>
                <SolidButton
                  isLoading={authSessionStore.isFetching}
                  minWidth={Spacing.extraExtraHuge}
                  selfAlign="center"
                  title="Send Email"
                  onPress={submit}
                />
              </Row>
            </CardContent>
          </Card>
        </Content>
      </Screen>
    )
  }
)

export default PasswordForgotScreen
