import React, { useMemo, useState } from "react"
import { ErrorBoundaryProps, Redirect, Stack, useNavigation, useRouter } from "expo-router";
import { observer } from "mobx-react-lite";
import { t } from "@i18n/translate";

import { Content, Screen } from "@common-ui/components/Screen"
import { MediumText, RegularText } from "@common-ui/components/Text"
import { ErrorDetails } from "@components/ErrorDetails";
import { Cell, RowOrCell } from "@common-ui/components/Common";
import { Spacing } from "@common-ui/constants/spacing";
import TitleWithBackButton from "@components/TitleWithBackButton";
import { ROUTES } from "app/_layout";
import { Card, CardContent, CardFooter } from "@common-ui/components/Card";
import { Input } from "@common-ui/components/Input";

import { useValidations } from "@utils/useValidations";
import { useStores } from "@models/helpers/useStores";
import { SimpleLinkButton, SolidButton } from "@common-ui/components/Button";
import { Colors } from "@common-ui/constants/colors";
import { If, Ternary } from "@common-ui/components/Conditional";
import ErrorMessage from "@common-ui/components/ErrorMessage";
import SuccessMessage from "@common-ui/components/SuccessMessage";

// We use this to wrap each screen with an error boundary
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorDetails {...props} />;
}

const sanitizeInput = (s) => {
  return s.replace( /[<&]/ig, '').replace( /(<([^>]+)>)/ig, '').trim();
}

const ProfileScreen = observer(
  function ProfileScreen() {
    const router = useRouter()
    const navigation = useNavigation()

    const { authSessionStore } = useStores()

    const [email, setEmail] = useState(authSessionStore.userEmail)
    const [firstName, setFirstName] = useState(authSessionStore.userFirstName)
    const [lastName, setLastName] = useState(authSessionStore.userLastName)

    const [submitted, setSubmitted] = useState(false)

    const fieldsToValidate = useMemo(
      () => ({ email, firstName, lastName })
    , [email, firstName, lastName])
    const [isFormValid] = useValidations(fieldsToValidate)

    if (!authSessionStore.isLoggedIn) {
      return <Redirect href={ROUTES.Home} />
    }

    const onEmailChange = (text) => {
      setEmail(sanitizeInput(text))
    }

    const onFirstNameChange = (text) => {
      setFirstName(sanitizeInput(text))
    }

    const onLastNameChange = (text) => {
      setLastName(sanitizeInput(text))
    }

    const submit = async () => {
      if (!isFormValid) return

      await authSessionStore.updateProfile({
        email,
        firstName,
        lastName,
      })

      setSubmitted(true)
    }

    const updatePhone = () => {
      router.push({ pathname: ROUTES.UserVerifyPhoneNumber })
    }

    const changePassword = () => {
      router.push({ pathname: ROUTES.UserSetPassword })
    }

    const goBack = () => {
      navigation.canGoBack() ?
        navigation.goBack() :
        router.push({ pathname: ROUTES.About })
    }

    return (
      <Screen>
        <Stack.Screen options={{ title: `${t("common.title")} - ${t("profileScreen.title")}` }} />
        <TitleWithBackButton
          title={t("navigation.profileScreen")}
          onPress={goBack}
        />
        <Content maxWidth={Spacing.tabletWidth} scrollable>
          <Card bottom={Spacing.large}>
            <If condition={authSessionStore.hasLoginProvider}>
              <Cell>
                <RegularText align="center">
                  Linked to {authSessionStore.loginProvider} account:
                </RegularText>
              </Cell>
            </If>
            <CardContent>
              <RowOrCell bottom={Spacing.small}>
                <Cell flex={1}>
                  <MediumText>First Name:</MediumText>
                </Cell>
                <Cell flex={5}>
                  <Ternary condition={authSessionStore.hasLoginProvider}>
                    <RegularText text={firstName} />
                    <Input
                      value={firstName}
                      placeholder="First Name"
                      onChangeText={onFirstNameChange}
                    />
                  </Ternary>
                </Cell>
              </RowOrCell>
              <RowOrCell bottom={Spacing.small}>
                <Cell flex={1}>
                  <MediumText>Last Name:</MediumText>
                </Cell>
                <Cell flex={5}>
                  <Ternary condition={authSessionStore.hasLoginProvider}>
                    <RegularText text={lastName} />
                    <Input
                      value={lastName}
                      placeholder="Last Name"
                      onChangeText={onLastNameChange}
                    />
                  </Ternary>
                </Cell>
              </RowOrCell>
              <RowOrCell bottom={Spacing.small}>
                <Cell flex={1}>
                  <MediumText>Email:</MediumText>
                </Cell>
                <Cell flex={5}>
                  <Ternary condition={authSessionStore.hasLoginProvider}>
                    <RegularText text={email} />
                    <Input
                      value={email}
                      placeholder="Email"
                      onChangeText={onEmailChange}
                      keyboardType="email-address"
                    />
                  </Ternary>
                </Cell>
              </RowOrCell>
              <RowOrCell bottom={Spacing.small}>
                <Cell flex={1}>
                  <MediumText>Phone:</MediumText>
                </Cell>
                <Cell flex={5}>
                  <RegularText>
                    {authSessionStore.userPhone}
                    <SimpleLinkButton
                      color={Colors.lightBlue}
                      text={authSessionStore.userPhone ? "  (Update...)" : "Enter phone number for SMS alerts"}
                      onPress={updatePhone}
                    />
                  </RegularText>
                </Cell>
              </RowOrCell>
              <RowOrCell bottom={Spacing.small}>
                <Cell flex={1}>
                  <MediumText>Password:</MediumText>
                </Cell>
                <Cell flex={5}>
                  <RegularText>
                    <SimpleLinkButton
                      color={Colors.lightBlue}
                      text="Change Password"
                      onPress={changePassword}
                    />
                  </RegularText>
                </Cell>
              </RowOrCell>
              <If condition={authSessionStore.isError}>
                <ErrorMessage errorText={authSessionStore.errorMessage} />
              </If>
              <If condition={submitted && !authSessionStore.isError}>
                <SuccessMessage successText="Updated!" />
              </If>
            </CardContent>
            <CardFooter>
              <SolidButton
                disabled={!isFormValid}
                isLoading={authSessionStore.isFetching}
                minWidth={Spacing.extraExtraHuge}
                title="Update"
                selfAlign="center"
                onPress={submit}
              />
            </CardFooter>
          </Card>
        </Content>
      </Screen>
    )
  }
)

export default ProfileScreen