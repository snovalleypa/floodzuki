import React, { useEffect, useState } from "react"
import { ErrorBoundaryProps, Redirect, Stack, useLocalSearchParams, useRouter } from "expo-router"

import { Screen, Content } from "@common-ui/components/Screen"
import { LabelText, RegularText, SmallTitle } from "@common-ui/components/Text"
import { ErrorDetails } from "@components/ErrorDetails"
import TitleWithBackButton from "@components/TitleWithBackButton"
import { Card, CardContent, CardFooter, CardHeader } from "@common-ui/components/Card"
import { LinkButton, SimpleLinkButton, SolidButton } from "@common-ui/components/Button"
import { openAppSettings, openLinkInBrowser } from "@utils/navigation"
import { Spacing } from "@common-ui/constants/spacing"
import CheckBoxItem from "@common-ui/components/CheckBoxItem"

import { ROUTES } from "app/_layout"
import Config from "@config/config"
import { Cell, Row, RowOrCell } from "@common-ui/components/Common"
import { useStores } from "@models/helpers/useStores"
import { Colors } from "@common-ui/constants/colors"
import { observer } from "mobx-react-lite"
import { If, Ternary } from "@common-ui/components/Conditional"
import { isIOS, isWeb } from "@common-ui/utils/responsive"
import ErrorMessage from "@common-ui/components/ErrorMessage"
import { Gage } from "@models/Gage"
import { Alert, Switch } from "react-native"
import { isPushNotificationsEnabledAsync } from "@services/pushNotifications"
import { useLocale } from "@common-ui/contexts/LocaleContext"

// We use this to wrap each screen with an error boundary
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorDetails {...props} />;
}

const AlertSettingsCard = observer(
  function AlertSettings() {
    const { authSessionStore } = useStores()
    const { t } = useLocale()
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

    const handlePushNotificationsValueChange = async () => {
      // if (authSessionStore.isPushNotificationsEnabled) {
      //   const permissionGranted = await isPushNotificationsEnabledAsync()

      //   if (!permissionGranted) {
      //     Alert.alert(
      //       t("alertsScreen.pnsDisabledTitle"),
      //       t("alertsScreen.pnsDisabledMessage"),
      //       [
      //         {
      //           text: t("alertsScreen.pnsDisabledButton"),
      //           onPress: () => openAppSettings(),
      //         }
      //       ]
      //     )

      //     return
      //   }
      // }

      authSessionStore.togglePushNotificationsEnabled(t)
    }

    const openPhoneNumber = () => {
      router.push({ pathname: ROUTES.UserVerifyPhoneNumber })
    }

    const isEmailVerified = authSessionStore.isEmailVerified
    const isPhoneVerified = authSessionStore.isPhoneVerified

    return (
      <Card bottom={Spacing.large}>
        <CardHeader>
          <SmallTitle>{t("alertsScreen.alertSettings")}</SmallTitle>
        </CardHeader>
        <CardContent>
          {/* Push Notifications */}
          <If condition={!isWeb}>
            <Row align="space-between" bottom={Spacing.small}>
              <Cell>
                <RegularText>
                {t("alertsScreen.enablePushNotifications")}
                </RegularText>
              </Cell>
              <Cell left={Spacing.extraSmall}>
                <Switch
                  trackColor={isIOS ? { false: Colors.lightGrey, true: Colors.primary } : {}}
                  value={authSessionStore.isPushNotificationsEnabled}
                  onValueChange={handlePushNotificationsValueChange}
                />
              </Cell>
            </Row>
          </If>
          {/* Email Settings */}
          <Cell>
            <If condition={!isEmailVerified}>
              <RegularText>
                {t("alertsScreen.verifyEmail")}
              </RegularText>
            </If>
            <Cell top={Spacing.extraSmall}>
              <CheckBoxItem
                isLoading={isUpdatingEmail}
                disabled={!isEmailVerified}
                label={`${t("alertsScreen.sendEmailAlertsTo")}: ${authSessionStore.user?.email}`}
                value={emailAlertsEnabled}
                onChange={updateEmailAlertsEnabled}
              />
            </Cell>
          </Cell>
          {/* Phone Settings */}
          <If condition={!isPhoneVerified}>
            <Cell top={Spacing.small}>
              <RegularText>
                <SimpleLinkButton
                  color={Colors.lightBlue}
                  text={t("alertsScreen.enterPhoneNumber")}
                  onPress={openPhoneNumber}
                />${t("alertsScreen.toReceiveAlerts")}
              </RegularText>
            </Cell>
          </If>
          <RowOrCell top={Spacing.extraSmall}>
            <Cell flex>
              <CheckBoxItem
                isLoading={isUpdatingSms}
                disabled={!isPhoneVerified}
                label={`${t("alertsScreen.sendSmsAlerts")}: ${authSessionStore.userPhone ?? ""}`}
                value={smsAlertsEnabled}
                onChange={updateSmsAlertsEnabled}
              />
            </Cell>
            <Cell flex>
              <LinkButton
                title={t("alertsScreen.changePhone")}
                onPress={openPhoneNumber}
              />
            </Cell>
          </RowOrCell>
        </CardContent>
        <If condition={!isEmailVerified}>
          <CardFooter>
            <If condition={authSessionStore.isError}>
              <ErrorMessage errorText={authSessionStore.errorMessage} />
            </If>
            <Ternary condition={isEmailSent && !authSessionStore.isError}>
              <RegularText>
                {t("alertsScreen.emailSent", { email: authSessionStore.user?.email })}
              </RegularText>
              <SolidButton
                small
                type="blue"
                selfAlign="center"
                isLoading={authSessionStore.isFetching}
                title={t("alertsScreen.verifyEmailTitle")}
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
    const { t } = useLocale()
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
          <SmallTitle>{t("alertsScreen.forecasts")}</SmallTitle>
        </CardHeader>
        <CardContent>
          <Cell bottom={Spacing.medium}>
            <RegularText>{t("alertsScreen.forecastsTitle")}</RegularText>
          </Cell>
          <CheckBoxItem
            disabled={!authSessionStore.isNotificationsEnabled}
            isLoading={isUpdatingForecast}
            label={t("alertsScreen.genericForecast")}
            value={forecastsEnabled}
            onChange={updateForecastsEnabled}
          />
          <CheckBoxItem
            disabled={!authSessionStore.isNotificationsEnabled}
            isLoading={isUpdatingDailyForecast}
            label={t("alertsScreen.dailyForecast")}
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
    const { add } = useLocalSearchParams()

    const [isUpdating, setIsUpdating] = useState(false)

    useEffect(() => {
      if (add && add === gage.locationId) {
        updateGageEnabled(true)
      }
    }, [add])

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
    const { t } = useLocale()
    const { getLocationsWithGages, authSessionStore } = useStores()
    const locations = getLocationsWithGages()

    return (
      <Card bottom={Spacing.large}>
        <CardHeader>
          <SmallTitle>{t("alertsScreen.gageAlerts")}</SmallTitle>
        </CardHeader>
        <CardContent>
          <Cell bottom={Spacing.medium}>
            <RegularText>{t("alertsScreen.gageAlertsTitle")}</RegularText>
            <If condition={!authSessionStore.isNotificationsEnabled}>
              <LabelText>{t("alertsScreen.gageAlertsSubtitle")}</LabelText>
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
    const { t } = useLocale();
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
              <SmallTitle>{t("alertsScreen.title")}</SmallTitle>
            </CardHeader>
            <CardContent>
              <RegularText lineHeight={Spacing.large}>
                {t("alertsScreen.welcomeText")}<SimpleLinkButton color={Colors.lightBlue} text={t("alertsScreen.letUsKnow")} onPress={mailTo} />{t("alertsScreen.howWeAreDoing")}
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
                title={t("alertsScreen.editProfile")}
                onPress={editProfile}
                right={Spacing.large}
              />
              <SolidButton
                selfAlign="center"
                type="danger"
                title={t("alertsScreen.logOut")}
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
