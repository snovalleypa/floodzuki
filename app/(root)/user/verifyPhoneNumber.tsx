import React, { useEffect, useMemo, useState } from "react";
import { ErrorBoundaryProps, Link, Redirect, useRouter } from "expo-router";
import { useGoBack } from "@utils/useGoBack";
import { KeyboardAvoidingView, Platform } from "react-native";

import { Screen, Content } from "@common-ui/components/Screen";
import { MediumText, RegularText, SmallerText } from "@common-ui/components/Text";
import { ErrorDetails } from "@components/ErrorDetails";
import TitleWithBackButton from "@components/TitleWithBackButton";
import { ROUTES } from "app/_layout";
import { Spacing } from "@common-ui/constants/spacing";
import { Card, CardContent, CardFooter } from "@common-ui/components/Card";
import { Cell, Row, RowOrCell, Spacer } from "@common-ui/components/Common";
import { Input } from "@common-ui/components/Input";
import { SimpleLinkButton, SolidButton } from "@common-ui/components/Button";
import { observer } from "mobx-react-lite";
import { useStores } from "@models/helpers/useStores";
import { If } from "@common-ui/components/Conditional";
import ErrorMessage from "@common-ui/components/ErrorMessage";
import { useValidations } from "@utils/useValidations";
import { useLocale } from "@common-ui/contexts/LocaleContext";
import PageTitle from "@common-ui/components/PageTitle";

// We use this to wrap each screen with an error boundary
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorDetails {...props} />;
}

const VerifyPhoneNumberScreen = observer(function VerifyPhoneNumberScreen() {
  const { t } = useLocale();
  const router = useRouter();

  const { authSessionStore } = useStores();

  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");

  const [codeSent, setCodeSent] = useState(false);
  const [codeVerified, setCodeVerified] = useState(false);

  // Phone presence validation
  const fieldsToValidate = useMemo(() => ({ phone }), [phone]);
  const [isValid] = useValidations(fieldsToValidate);

  // Code presence validation
  const codeFieldsToValidate = useMemo(() => ({ code }), [code]);
  const [isCodeValid] = useValidations(codeFieldsToValidate);

  const goBack = useGoBack(ROUTES.UserAlerts);

  // Clear any errors when the screen is loaded
  useEffect(() => {
    authSessionStore.clearDataFetching();
  }, []);

  // Redirect to alerts screen if the user is already verified
  if (codeSent && codeVerified && !authSessionStore.isError && authSessionStore.isPhoneVerified) {
    return <Redirect href={ROUTES.UserAlerts} />;
  }

  const sendPhoneVerificationCode = async () => {
    await authSessionStore.sendPhoneVerificationCode({ phone });

    setCodeSent(true);
  };

  const submitCodeVerification = async () => {
    await authSessionStore.verifyPhoneCode({ phone, code });

    // Update user info
    await authSessionStore.reauthenticate();

    setCodeVerified(true);
  };

  const openPrivacyPolicy = () => {
    router.push({ pathname: ROUTES.Privacy });
  };

  const openTermsOfService = () => {
    router.push({ pathname: ROUTES.Terms });
  };

  const title = authSessionStore.userPhone
    ? t("navigation.changePhoneNumberScreen")
    : t("navigation.verifyPhoneNumberScreen");

  const sendButtonTitle = codeSent
    ? t("verifyPhoneNumberScreen.resendVerification")
    : t("verifyPhoneNumberScreen.sendVerification");

  return (
    <Screen>
      <PageTitle name={title} />
      <TitleWithBackButton title={title} onPress={goBack} />
      <Content maxWidth={Spacing.tabletWidth} scrollable>
        <Card bottom={Spacing.large}>
          <CardContent>
            {/* Description */}
            <RegularText lineHeight={Spacing.large}>
              {t("verifyPhoneNumberScreen.description")}
            </RegularText>
            {/* Phone Number */}
            <RowOrCell vertical={Spacing.small}>
              <Cell flex={1}>
                <MediumText>{t("verifyPhoneNumberScreen.phoneNumber")}</MediumText>
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
            <Row align="space-evenly" top={Spacing.small} bottom={Spacing.small}>
              <SolidButton
                disabled={!isValid}
                isLoading={authSessionStore.isFetching}
                minWidth={Spacing.extraExtraHuge}
                selfAlign="center"
                title={sendButtonTitle}
                onPress={sendPhoneVerificationCode}
              />
            </Row>
            <Row align="space-evenly" top={Spacing.small} bottom={Spacing.large}>
              <SmallerText lineHeight={Spacing.medium}>
                {t("verifyPhoneNumberScreen.verificationConsentBeforeButton")}
                {sendButtonTitle}
                {t("verifyPhoneNumberScreen.verificationConsentAfterButton")}
                <SimpleLinkButton
                  text={t("navigation.termsOfServiceScreen")}
                  onPress={openTermsOfService}
                />
                {t("verifyPhoneNumberScreen.verificationConsentBetweenLinks")}
                <SimpleLinkButton
                  text={t("navigation.privacyPolicyScreen")}
                  onPress={openPrivacyPolicy}
                />
                {t("verifyPhoneNumberScreen.verificationConsentAfterLinks")}
              </SmallerText>
            </Row>
            {/* Code Verification */}
            <If condition={codeSent}>
              <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
                <Spacer />
                <RegularText>
                  {t("verifyPhoneNumberScreen.confirmationText", { phoneNumber: phone })}
                </RegularText>
                <RowOrCell vertical={Spacing.small}>
                  <Cell flex={1}>
                    <MediumText>{t("verifyPhoneNumberScreen.verificationCode")}</MediumText>
                  </Cell>
                  <Cell flex={5}>
                    <Input
                      value=""
                      placeholder={t("verifyPhoneNumberScreen.verificationCodePlaceholder")}
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
                    title={t("verifyPhoneNumberScreen.submit")}
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
  );
});

export default VerifyPhoneNumberScreen;
