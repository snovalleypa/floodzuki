import React, { useEffect, useState } from "react"
import { ErrorBoundaryProps, Redirect, Stack, useRouter } from "expo-router"
import { t } from "@i18n/translate"

import { Screen, Content } from "@common-ui/components/Screen"
import { LabelText, RegularText, SmallTitle } from "@common-ui/components/Text"
import { ErrorDetails } from "@components/ErrorDetails"
import TitleWithBackButton from "@components/TitleWithBackButton"
import { Card, CardContent, CardFooter, CardHeader } from "@common-ui/components/Card"
import { LinkButton, SimpleLinkButton, SolidButton } from "@common-ui/components/Button"
import { openLinkInBrowser } from "@utils/navigation"
import { Spacing } from "@common-ui/constants/spacing"
import CheckBoxItem from "@common-ui/components/CheckBoxItem"

import { ROUTES } from "app/_layout"
import Config from "@config/config"
import { Cell, Row } from "@common-ui/components/Common"
import { useStores } from "@models/helpers/useStores"
import { Colors } from "@common-ui/constants/colors"
import { observer } from "mobx-react-lite"
import { If, Ternary } from "@common-ui/components/Conditional"
import { isWeb } from "@common-ui/utils/responsive"
import ErrorMessage from "@common-ui/components/ErrorMessage"
import { Gage } from "@models/Gage"

// We use this to wrap each screen with an error boundary
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorDetails {...props} />;
}

const AlertSettingsCard = observer(
  function AlertSettings() {
    const { authSessionStore } = useStores()
    const router = useRouter()

    const [isEmailSent, setIsEmailSent] = useState(false)

    const [isUpdatingEmail, setIsUpdatingEmail] = useState(false)
    const [isUpdatingSms, setIsUpdatingSms] = useState(false)

    const emailAlertsEnabled = authSessionStore.userSettings?.notifyViaEmail
    const smsAlertsEnabled = authSessionStore.userSettings?.notifyViaSms

    const updateEmailAlertsEnabled = async (value: boolean) => {
      setIsUpdatingEmail(true)

      await authSessionStore.updateSettings({
        ...authSessionStore.userSettings,
        notifyViaEmail: value,
      })

      setIsUpdatingEmail(false)
    }

    const updateSmsAlertsEnabled = async (value: boolean) => {
      setIsUpdatingSms(true)

      await authSessionStore.updateSettings({
        ...authSessionStore.userSettings,
        notifyViaSms: value,
      })

      setIsUpdatingSms(false)
    }

    const verifyEmail = async () => {
      setIsEmailSent(false)

      await authSessionStore.sendVerificationEmail()

      setIsEmailSent(true)
    }

    const openPhoneNumber = () => {
      router.push({ pathname: ROUTES.UserVerifyPhoneNumber })
    }

    const isEmailVerified = authSessionStore.isEmailVerified
    const isPhoneVerified = authSessionStore.isPhoneVerified

    return (
      <Card bottom={Spacing.large}>
        <CardHeader>
          <SmallTitle>Alert Settings</SmallTitle>
        </CardHeader>
        <CardContent>
          <Cell>
            <If condition={!isEmailVerified}>
              <RegularText>
                Verify your email address to receive email alerts
              </RegularText>
            </If>
            <Cell top={Spacing.extraSmall}>
              <CheckBoxItem
                isLoading={isUpdatingEmail}
                disabled={!isEmailVerified}
                label={`Send alerts via email to: ${authSessionStore.user?.email}`}
                value={emailAlertsEnabled}
                onChange={updateEmailAlertsEnabled}
              />
            </Cell>
          </Cell>
          <If condition={!isPhoneVerified}>
            <Cell top={Spacing.small}>
              <RegularText>
                <SimpleLinkButton
                  color={Colors.lightBlue}
                  text="Enter a phone number "
                  onPress={openPhoneNumber}
                />to receive SMS alerts
              </RegularText>
            </Cell>
          </If>
          <Row top={Spacing.extraSmall} wrap>
            <Cell flex>
              <CheckBoxItem
                isLoading={isUpdatingSms}
                disabled={!isPhoneVerified}
                label={`Send alerts via SMS to: ${authSessionStore.userPhone ?? ""}`}
                value={smsAlertsEnabled}
                onChange={updateSmsAlertsEnabled}
              />
            </Cell>
            <LinkButton
              title="(Change Phone Number)"
              onPress={openPhoneNumber}
            />
          </Row>
        </CardContent>
        <If condition={!isEmailVerified}>
          <CardFooter>
            <If condition={authSessionStore.isError}>
              <ErrorMessage errorText={authSessionStore.errorMessage} />
            </If>
            <Ternary condition={isEmailSent && !authSessionStore.isError}>
              <RegularText>
                An email has been sent to {authSessionStore.user?.email}. Please click on the link in that email to verify your email address.
              </RegularText>
              <SolidButton
                small
                type="blue"
                selfAlign="center"
                isLoading={authSessionStore.isFetching}
                title="Verify Email Address"
                onPress={verifyEmail}
              />
            </Ternary>
          </CardFooter>
        </If>
      </Card>
    )
  }
)

const ForecastsCard = observer(
  function ForecastsCard() {
    const { authSessionStore } = useStores()

    const [isUpdatingForecast, setIsUpdatingForecast] = useState(false)
    const [isUpdatingDailyForecast, setIsUpdatingDailyForecast] = useState(false)

    const dailyForecastsEnabled = authSessionStore.userSettings?.notifyDailyForecasts
    const forecastsEnabled = authSessionStore.userSettings?.notifyForecastAlerts

    const updateForecastsEnabled = async (value: boolean) => {
      setIsUpdatingForecast(true)

      await authSessionStore.updateSettings({
        ...authSessionStore.userSettings,
        notifyForecastAlerts: value,
      })

      setIsUpdatingForecast(false)
    }

    const updateDailyForecastsEnabled = async (value: boolean) => {
      setIsUpdatingDailyForecast(true)

      await authSessionStore.updateSettings({
        ...authSessionStore.userSettings,
        notifyDailyForecasts: value,
      })

      setIsUpdatingDailyForecast(false)
    }

    return (
      <Card bottom={Spacing.large}>
        <CardHeader>
          <SmallTitle>Forecasts</SmallTitle>
        </CardHeader>
        <CardContent>
          <Cell bottom={Spacing.medium}>
            <RegularText>Floodzilla can send you river forecasts.</RegularText>
          </Cell>
          <CheckBoxItem
            isLoading={isUpdatingForecast}
            label="Send me flood forecast alerts (typically once or twice a day during flood events)."
            value={forecastsEnabled}
            onChange={updateForecastsEnabled}
          />
          <CheckBoxItem
            isLoading={isUpdatingDailyForecast}
            label="Send me daily river status and crest forecasts."
            value={dailyForecastsEnabled}
            onChange={updateDailyForecastsEnabled}
          />
        </CardContent>
      </Card>
    )
  }
)

const GageCheckboxItem = observer(
  function GageCheckboxItem({ gage }: { gage: Gage }) {
    const { authSessionStore } = useStores()

    const [isUpdating, setIsUpdating] = useState(false)

    const updateGageEnabled = async (value: boolean) => {
      setIsUpdating(true)

      await authSessionStore.setGageSubscription(gage.locationId, value)

      setIsUpdating(false)
    }

    const isSubscribed = (authSessionStore.gageSubscriptions ?? []).includes(gage.locationId)

    return (
      <CheckBoxItem
        disabled={!authSessionStore.isNotificationsEnabled}
        isLoading={isUpdating}
        label={`${gage.locationId} ${gage.locationInfo?.locationName}`}
        value={isSubscribed}
        onChange={updateGageEnabled}
      />
    )
  }
)

const GagesCard = observer(
  function GagesCard() {
    const { getLocationsWithGages, authSessionStore } = useStores()
    const locations = getLocationsWithGages()

    return (
      <Card bottom={Spacing.large}>
        <CardHeader>
          <SmallTitle>Forecasts</SmallTitle>
        </CardHeader>
        <CardContent>
          <Cell bottom={Spacing.medium}>
            <RegularText>Alert me about status changes for these gages:</RegularText>
            <If condition={!authSessionStore.isNotificationsEnabled}>
              <LabelText>Please enable one of the notifications channels (Email, SMS, Push Notifications) to manage this settings</LabelText>
            </If>
          </Cell>
          {locations.map((gage) => (
            <GageCheckboxItem
              key={gage.locationId}
              gage={gage}
            />
          ))}
        </CardContent>
      </Card>
    )
  }
)

const AlertsScreen = observer(
  function AlertsScreen() {
    const router = useRouter()
    const { authSessionStore } = useStores()
    
    const isLoggedIn = authSessionStore.isLoggedIn

    useEffect(() => {
      authSessionStore.clearError()
      
      authSessionStore.getSettings()
      authSessionStore.getSubscribedGages()
    }, [])

    if (!isLoggedIn) {
      return <Redirect href={ROUTES.UserLogin} />
    }

    const goBack = () => {
      router.push({ pathname: ROUTES.About })
    }

    const editProfile = () => {
      router.push({ pathname: ROUTES.UserProfile })
    }

    const mailTo = () => {
      openLinkInBrowser(`mailto:${Config.SVPA_EMAIL}?Subject=Alerts+Feedback`)
    }

    return (
      <Screen>
        <Stack.Screen options={{ title: `${t("common.title")} - ${t("homeScreen.title")}` }} />
        <TitleWithBackButton
          title={t("navigation.alertsScreen")}
          onPress={goBack}
          webEnabled={false}
        />
        <Content maxWidth={Spacing.tabletWidth} scrollable>
          {/* Title */}
          <Card bottom={Spacing.large}>
            <CardHeader>
              <SmallTitle>Floodzilla Alerts Beta</SmallTitle>
            </CardHeader>
            <CardContent>
              <RegularText lineHeight={Spacing.large}>
                Welcome to the Floodzilla Alerts Beta! We will send you alerts via email or SMS Text message when we detect flood conditions.{"\n\n"}
                We need your feedback. <SimpleLinkButton color={Colors.lightBlue} text="Let us know" onPress={mailTo} /> how we're doing.
              </RegularText>
            </CardContent>
          </Card>
          {/* Alert Settings */}
          <AlertSettingsCard />
          {/* Forecasts */}
          <ForecastsCard />
          {/* Gage Alerts */}
          <GagesCard />
          {/* Log Out if Logged In */}
          <If condition={isWeb && isLoggedIn}>
            <Row align="center">
              <SolidButton
                selfAlign="center"
                type="blue"
                title="Edit Profile"
                onPress={editProfile}
                right={Spacing.large}
              />
              <SolidButton
                selfAlign="center"
                type="danger"
                title="Log Out"
                onPress={authSessionStore.logOut}
              />
            </Row>
          </If>
        </Content>
      </Screen>
    )
  }
)

export default AlertsScreen
