import React, { useEffect, useMemo, useState } from "react"
import { ErrorBoundaryProps, Redirect, useNavigation, useRouter } from "expo-router"
import { KeyboardAvoidingView, Platform } from "react-native"

import { Screen, Content } from "@common-ui/components/Screen"
import { MediumText, RegularText } from "@common-ui/components/Text"
import { ErrorDetails } from "@components/ErrorDetails"
import TitleWithBackButton from "@components/TitleWithBackButton"
import { ROUTES } from "app/_layout"
import { Spacing } from "@common-ui/constants/spacing"
import { Card, CardContent, CardFooter } from "@common-ui/components/Card"
import { Cell, Row, RowOrCell, Spacer } from "@common-ui/components/Common"
import { Input } from "@common-ui/components/Input"
import { SolidButton } from "@common-ui/components/Button"
import { observer } from "mobx-react-lite"
import { useStores } from "@models/helpers/useStores"
import { If } from "@common-ui/components/Conditional"
import ErrorMessage from "@common-ui/components/ErrorMessage"
import { useValidations } from "@utils/useValidations"
import { useLocale } from "@common-ui/contexts/LocaleContext"
import Head from "expo-router/head"

// We use this to wrap each screen with an error boundary
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorDetails {...props} />;
}

const VerifyPhoneNumberScreen = observer(
  function VerifyPhoneNumberScreen() {
    const router = useRouter()
    const navigation = useNavigation()
    const { t } = useLocale();
    
    const { authSessionStore } = useStores()

    const [phone, setPhone] = useState("")
    const [code, setCode] = useState("")
    
    const [codeSent, setCodeSent] = useState(false)
    const [codeVerified, setCodeVerified] = useState(false)

    // Phone presence validation
    const fieldsToValidate = useMemo(
      () => ({ phone })
    , [phone])
    const [isValid] = useValidations(fieldsToValidate)

    // Code presence validation
    const codeFieldsToValidate = useMemo(
      () => ({ code })
    , [code])
    const [isCodeValid] = useValidations(codeFieldsToValidate)

    // Clear any errors when the screen is loaded
    useEffect(() => {
      authSessionStore.clearDataFetching()
    }, [])

    // Redirect to alerts screen if the user is already verified
    if (codeSent && codeVerified && !authSessionStore.isError && authSessionStore.isPhoneVerified) {
      return <Redirect href={ROUTES.UserAlerts} />
    }

    const sendPhoneVerificationCode = async () => {
      await authSessionStore.sendPhoneVerificationCode({ phone })

      setCodeSent(true)
    }

    const submitCodeVerification = async () => {
      await authSessionStore.verifyPhoneCode({ phone, code })

      // Update user info
      await authSessionStore.reauthenticate()

      setCodeVerified(true)
    }

    const goBack = () => {
      navigation.canGoBack() ?
        navigation.goBack() :
        router.push({ pathname: ROUTES.UserAlerts })
    }

    const title = authSessionStore.userPhone ?
      t("navigation.changePhoneNnumberScreen") :
      t("navigation.verifyPhoneNnumberScreen")

    const sendButtonTitle = codeSent ?
      t("verifyphonenumberScreen.resendVerification") :
      t("verifyphonenumberScreen.sendVerification")
    
    return (
      <Screen>
        <Head>
          <title>{t("common.title")} - {t("homeScreen.title")}</title>
        </Head>
        <TitleWithBackButton
          title={title}
          onPress={goBack}
        />
        <Content maxWidth={Spacing.tabletWidth} scrollable>
          <Card bottom={Spacing.large}>
            <CardContent>
              {/* Description */}
              <RegularText lineHeight={Spacing.large}>
                {t("verifyphonenumberScreen.description")}
              </RegularText>
              {/* Phone Number */}
              <RowOrCell vertical={Spacing.small}>
                <Cell flex={1}>
                  <MediumText>{t("verifyphonenumberScreen.phoneNumber")}</MediumText>
                </Cell>
                <Cell flex={5}>
                  <Input
                    value=""
                    placeholder="XXXXXXXXXX"
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                  />
                </Cell>
              </RowOrCell>
              <If condition={authSessionStore.isError}>
                <ErrorMessage errorText={authSessionStore.errorMessage} />
              </If>
              <Row align="space-evenly" top={Spacing.small} bottom={Spacing.large}>
                <SolidButton
                  disabled={!isValid}
                  isLoading={authSessionStore.isFetching}
                  minWidth={Spacing.extraExtraHuge}
                  selfAlign="center"
                  title={sendButtonTitle}
                  onPress={sendPhoneVerificationCode}
                />
              </Row>
              {/* Code Verification */}
              <If condition={codeSent}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                  <Spacer />
                  <RegularText>
                    {t("verifyphonenumberScreen.confirmationText", { phoneNumber: phone })}
                  </RegularText>
                  <RowOrCell vertical={Spacing.small}>
                    <Cell flex={1}>
                      <MediumText>{t("verifyphonenumberScreen.verificationCode")}</MediumText>
                    </Cell>
                    <Cell flex={5}>
                      <Input
                        value=""
                        placeholder={t("verifyphonenumberScreen.verificationCodePlaceholder")}
                        onChangeText={setCode}
                        keyboardType="number-pad"
                      />
                    </Cell>
                  </RowOrCell>
                  <Row align="space-evenly" top={Spacing.small} bottom={Spacing.large}>
                    <SolidButton
                      disabled={!isCodeValid}
                      isLoading={authSessionStore.isFetching}
                      minWidth={Spacing.extraExtraHuge}
                      selfAlign="center"
                      title={t("verifyphonenumberScreen.submit")}
                      onPress={submitCodeVerification}
                      type="blue"
                    />
                  </Row>
                </KeyboardAvoidingView>
              </If>
            </CardContent>
          </Card>
        </Content>
      </Screen>
    )
  }
)

export default VerifyPhoneNumberScreen
