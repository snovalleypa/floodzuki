import React, { useEffect, useMemo, useRef, useState } from "react"
import { ErrorBoundaryProps, Redirect, Stack, useRouter } from "expo-router"
import { observer } from "mobx-react-lite"

import { Screen, Content } from "@common-ui/components/Screen"
import { MediumText, RegularText } from "@common-ui/components/Text"
import { ErrorDetails } from "@components/ErrorDetails"
import TitleWithBackButton from "@components/TitleWithBackButton"
import { ROUTES } from "app/_layout"
import { Spacing } from "@common-ui/constants/spacing"
import { Card, CardContent, CardFooter, CardHeader } from "@common-ui/components/Card"
import { Cell, Row, RowOrCell } from "@common-ui/components/Common"
import { Input } from "@common-ui/components/Input"
import CheckBoxItem from "@common-ui/components/CheckBoxItem"
import { LinkButton, OutlinedButton, SolidButton } from "@common-ui/components/Button"
import GoogleRecaptcha from "@components/GoogleRecaptcha"
import { useStores } from "@models/helpers/useStores"
import { If } from "@common-ui/components/Conditional"
import ErrorMessage from "@common-ui/components/ErrorMessage"
import { useValidations } from "@utils/useValidations"
import GoogleSigninButton from "@components/GoogleSigninButton"
import { useLocale } from "@common-ui/contexts/LocaleContext"

// We use this to wrap each screen with an error boundary
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorDetails {...props} />;
}

const LoginScreen = observer(
  function LoginScreen() {
    const router = useRouter()
    const { t } = useLocale();
    const { authSessionStore } = useStores()

    const recaptcha = useRef(null)

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [rememberMe, setRememberMe] = useState(true)

    const fieldsToValidate = useMemo(
      () => ({ email, password })
    , [email, password])

    const [isValid] = useValidations(fieldsToValidate)

    // Clear any errors when the screen is loaded
    useEffect(() => {
      authSessionStore.clearDataFetching()
    }, [])

    // If the user is already logged in, redirect them to the home screen
    if (authSessionStore.isLoggedIn) {
      return <Redirect href={ROUTES.UserAlerts} />
    }

    const loginUser = async (captchaToken: string) => {
      await authSessionStore.logIn({
        username: email,
        password,
        rememberMe,
        captchaToken
      })

      recaptcha.current?.reset();
    }

    const createAccount = () => {
      router.push({ pathname: ROUTES.UserNew })
    }

    const forgotPassword = () => {
      router.push({ pathname: ROUTES.UserPasswordForgot })
    }

    const submit = () => {
      if (!isValid) return

      recaptcha.current?.reset();
      recaptcha.current?.open();
    }

    const onVerify = (captchaToken: string) => {
      loginUser(captchaToken)
    }
    
    // This is called when the recaptcha expires
    const onExpire = () => {
      recaptcha.current?.open();
    }

    const goBack = () => {
      router.push({ pathname: ROUTES.About })
    }
    
    return (
      <Screen>
        <Stack.Screen options={{ title: `${t("common.title")} - ${t("homeScreen.title")}` }} />
        <TitleWithBackButton
          title={t("navigation.loginScreen")}
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
              <CardHeader>
                <RegularText align="center">
                  {t("loginScreen.title")}
                </RegularText>
              </CardHeader>
              <RowOrCell bottom={Spacing.small} top={Spacing.medium}>
                <Cell flex={1}>
                  <MediumText>{t("loginScreen.email")}</MediumText>
                </Cell>
                <Cell flex={5}>
                  <Input
                    value=""
                    keyboardType="email-address"
                    placeholder={t("loginScreen.emailPlaceholder")}
                    onChangeText={setEmail}
                  />
                </Cell>
              </RowOrCell>
              <Cell>
                <RowOrCell bottom={Spacing.small}>
                  <Cell flex={1}>
                    <MediumText>{t("loginScreen.password")}</MediumText>
                  </Cell>
                  <Cell flex={5}>
                    <Input
                      value=""
                      secureTextEntry
                      placeholder={t("loginScreen.passwordPlaceholder")}
                      onChangeText={setPassword}
                    />
                  </Cell>
                </RowOrCell>
                <LinkButton
                  disabled={authSessionStore.isFetching}
                  selfAlign="center"
                  title={t("loginScreen.passwordForgot")}
                  onPress={forgotPassword}
                />
              </Cell>
              <Cell top={Spacing.medium}>
                <CheckBoxItem
                  label={t("loginScreen.rememberMe")}
                  value={rememberMe}
                  onChange={setRememberMe}
                />
              </Cell>
              <If condition={authSessionStore.isError}>
                <ErrorMessage errorText={authSessionStore.errorMessage} />
              </If>
              <Row align="space-evenly" top={Spacing.small} bottom={Spacing.large}>
                <OutlinedButton
                  disabled={authSessionStore.isFetching}
                  minWidth={Spacing.extraExtraHuge}
                  selfAlign="center"
                  title={t("loginScreen.createAccount")}
                  onPress={createAccount}
                />
                <SolidButton
                  isLoading={authSessionStore.isFetching}
                  minWidth={Spacing.extraExtraHuge}
                  selfAlign="center"
                  title={t("loginScreen.login")}
                  onPress={submit}
                />
              </Row>
            </CardContent>
            <CardFooter>
              <GoogleSigninButton />
            </CardFooter>
          </Card>
        </Content>
      </Screen>
    )
  }
)

export default LoginScreen
