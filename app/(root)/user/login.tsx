import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ErrorBoundaryProps, Redirect, Stack, useRouter } from "expo-router"
import { observer } from "mobx-react-lite"
import { t } from "@i18n/translate"

import { Screen, Content } from "@common-ui/components/Screen"
import { MediumText, RegularText } from "@common-ui/components/Text"
import { ErrorDetails } from "@components/ErrorDetails"
import TitleWithBackButton from "@components/TitleWithBackButton"
import { ROUTES } from "app/_layout"
import { Spacing } from "@common-ui/constants/spacing"
import { Card, CardContent, CardFooter } from "@common-ui/components/Card"
import { Cell, Row, RowOrCell } from "@common-ui/components/Common"
import { Input } from "@common-ui/components/Input"
import CheckBoxItem from "@common-ui/components/CheckBoxItem"
import { LinkButton, OutlinedButton, SolidButton } from "@common-ui/components/Button"
import GoogleRecaptcha from "@components/GoogleRecaptcha"
import { useStores } from "@models/helpers/useStores"
import { If } from "@common-ui/components/Conditional"
import ErrorMessage from "@common-ui/components/ErrorMessage"
import { useValidations } from "@utils/useValidations"

// We use this to wrap each screen with an error boundary
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorDetails {...props} />;
}

const LoginScreen = observer(
  function LoginScreen() {
    const router = useRouter()
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

    const signInWithGoogle = () => {
      // TODO: Implement google Sign In
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
              <RegularText>
                Log In to receive flooding notifications and other updates.
              </RegularText>
              <RowOrCell bottom={Spacing.small} top={Spacing.medium}>
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
              <Cell>
                <RowOrCell bottom={Spacing.small}>
                  <Cell flex={1}>
                    <MediumText>Password</MediumText>
                  </Cell>
                  <Cell flex={5}>
                    <Input
                      value=""
                      secureTextEntry
                      placeholder="Enter your password"
                      onChangeText={setPassword}
                    />
                  </Cell>
                </RowOrCell>
                <LinkButton
                  disabled={authSessionStore.isFetching}
                  selfAlign="center"
                  title="Forgot password?"
                  onPress={forgotPassword}
                />
              </Cell>
              <Cell top={Spacing.medium}>
                <CheckBoxItem
                  label={`Remember me`}
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
                  title="Create Account"
                  onPress={createAccount}
                />
                <SolidButton
                  isLoading={authSessionStore.isFetching}
                  minWidth={Spacing.extraExtraHuge}
                  selfAlign="center"
                  title="Login"
                  onPress={submit}
                />
              </Row>
            </CardContent>
            <CardFooter>
              <OutlinedButton
                disabled={authSessionStore.isFetching}
                selfAlign="center"
                leftIcon="at-sign"
                type="lightBlue"
                title="Sign in with Google"
                onPress={signInWithGoogle}
              />
            </CardFooter>
          </Card>
        </Content>
      </Screen>
    )
  }
)

export default LoginScreen
