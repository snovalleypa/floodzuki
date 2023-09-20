import React, { useEffect, useState } from "react"
import { ErrorBoundaryProps, Link, Stack, useLocalSearchParams, useRouter } from "expo-router"

import { Screen, Content } from "@common-ui/components/Screen"
import { LabelText, RegularLargeText, RegularText, SmallTitle } from "@common-ui/components/Text"
import { ErrorDetails } from "@components/ErrorDetails"
import TitleWithBackButton from "@components/TitleWithBackButton"
import { Card, CardContent, CardFooter, CardHeader } from "@common-ui/components/Card"
import { LinkButton, OutlinedButton, SimpleLinkButton, SolidButton } from "@common-ui/components/Button"
import { openLinkInBrowser } from "@utils/navigation"
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
import { Switch } from "react-native"
import { useLocale } from "@common-ui/contexts/LocaleContext"
import Head from "expo-router/head"

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
      authSessionStore.togglePushNotificationsEnabled(t)
    }

    const openPhoneNumber = () => {
      router.push({ pathname: ROUTES.UserVerifyPhoneNumber })
    }

    const isEmailVerified = authSessionStore.isEmailVerified
    const isPhoneVerified = authSessionStore.isPhoneVerified
    const isLoggedIn = authSessionStore.isLoggedIn

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
                <RegularText muted={!authSessionStore.isLoggedIn}>
                  {t("alertsScreen.enablePushNotifications")}
                </RegularText>
              </Cell>
              <Cell left={Spacing.extraSmall}>
                <Switch
                  disabled={!authSessionStore.isLoggedIn}
                  trackColor={isIOS ? { false: Colors.lightGrey, true: Colors.primary } : {}}
                  value={authSessionStore.isPushNotificationsEnabled}
                  onValueChange={handlePushNotificationsValueChange}
                />
              </Cell>
            </Row>
          </If>
          {/* Email Settings */}
          <Cell>
            <If condition={!isEmailVerified && isLoggedIn}>
              <RegularText>
                {t("alertsScreen.verifyEmail")}
              </RegularText>
            </If>
            <Cell top={Spacing.extraSmall}>
              <CheckBoxItem
                isLoading={isUpdatingEmail}
                disabled={!isEmailVerified || !isLoggedIn}
                label={`${t("alertsScreen.sendEmailAlertsTo")}: ${isLoggedIn ? authSessionStore.user?.email : ""}`}
                value={emailAlertsEnabled && isLoggedIn}
                onChange={updateEmailAlertsEnabled}
              />
            </Cell>
          </Cell>
          {/* Phone Settings */}
          <If condition={!isPhoneVerified && isLoggedIn}>
            <Cell top={Spacing.small}>
              <RegularText>
                <SimpleLinkButton
                  color={Colors.lightBlue}
                  text={t("alertsScreen.enterPhoneNumber")}
                  onPress={openPhoneNumber}
                />{t("alertsScreen.toReceiveAlerts")}
              </RegularText>
            </Cell>
          </If>
          <RowOrCell top={Spacing.extraSmall}>
            <Cell flex>
              <CheckBoxItem
                isLoading={isUpdatingSms}
                disabled={!isPhoneVerified || !isLoggedIn}
                label={`${t("alertsScreen.sendSmsAlerts")}: ${authSessionStore.userPhone ?? ""}`}
                value={smsAlertsEnabled && isLoggedIn}
                onChange={updateSmsAlertsEnabled}
              />
            </Cell>
            <If condition={isLoggedIn}>
              <Cell flex>
                <LinkButton
                  title={t("alertsScreen.changePhone")}
                  onPress={openPhoneNumber}
                />
              </Cell>
            </If>
          </RowOrCell>
        </CardContent>
        <If condition={!isEmailVerified && authSessionStore.isLoggedIn}>
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

    const { isLoggedIn, isNotificationsEnabled } = authSessionStore

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
            disabled={!isNotificationsEnabled || !isLoggedIn}
            isLoading={isUpdatingForecast}
            label={t("alertsScreen.genericForecast")}
            value={forecastsEnabled}
            onChange={updateForecastsEnabled}
          />
          <CheckBoxItem
            disabled={!isNotificationsEnabled || !isLoggedIn}
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
    const { isLoggedIn, isNotificationsEnabled } = authSessionStore

    return (
      <CheckBoxItem
        disabled={!isNotificationsEnabled || !isLoggedIn}
        isLoading={isUpdating}
        label={`${gage.locationId} ${gage.locationInfo?.locationName}`}
        value={isSubscribed && isLoggedIn}
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

    const goBack = () => {
      router.push({ pathname: ROUTES.About })
    }

    const editProfile = () => {
      router.push({ pathname: ROUTES.UserProfile })
    }

    const navigateToLogin = () => {
      router.push({ pathname: ROUTES.UserLogin })
    }

    const navigateToSignup = () => {
      router.push({ pathname: ROUTES.UserNew })
    }

    const openDonationScreen = () => {
      openLinkInBrowser("https://www.paypal.com/donate/?cmd=_s-xclick&hosted_button_id=MPUFPPAW7AMYA&ssrt=1694550998333")
    }

    const mailTo = () => {
      openLinkInBrowser(`mailto:${Config.SVPA_EMAIL}?Subject=Alerts+Feedback`)
    }

    return (
      <Screen>
        <Head>
          <title>{t("common.title")} - {t("homeScreen.title")}</title>
        </Head>
        <TitleWithBackButton
          title={t("navigation.alertsScreen")}
          onPress={goBack}
          webEnabled={false}
        />
        <Content maxWidth={Spacing.tabletWidth} scrollable>
          {/* Support */}
          <Card outline type="lightBlue" bottom={Spacing.large}>
            <CardHeader>
              <SmallTitle>{t("donation.title")}</SmallTitle>
            </CardHeader>
            <CardContent>
              <RegularText lineHeight={Spacing.large}>
                {t("donation.description")}
              </RegularText>
            </CardContent>
            <CardFooter>
              <Row align="center">
                <SolidButton
                  type="lightBlue"
                  minWidth={Spacing.extraExtraHuge}
                  selfAlign="center"
                  leftIcon="heart"
                  title={t("donation.donate")}
                  onPress={openDonationScreen}
                />
              </Row>
            </CardFooter>
          </Card>
          {/* Title */}
          <Card bottom={Spacing.large}>
            <CardHeader>
              <SmallTitle>{t("alertsScreen.title")}</SmallTitle>
            </CardHeader>
            <CardContent>
              <RegularText lineHeight={Spacing.large}>
                {t("alertsScreen.welcomeText")}
              </RegularText>
              <RegularText lineHeight={Spacing.large}>
                {t("alertsScreen.weNeedFeedback")}{" "}<SimpleLinkButton lineHeight={Spacing.large} color={Colors.lightBlue} text={t("alertsScreen.letUsKnow")} onPress={mailTo} />{t("alertsScreen.howWeAreDoing")}
              </RegularText>
            </CardContent>
          </Card>
          {/* LogIn Promo */}
          <If condition={!isLoggedIn}>
            <Card outline type="warning" bottom={Spacing.large}>
              <RegularLargeText align="center" lineHeight={Spacing.large}>
                {t("loginScreen.title")}
              </RegularLargeText>
              <RegularText align="center" lineHeight={Spacing.small}>
                {"\n"}
              </RegularText>
              <CardFooter>
              <Row align="center">
                <OutlinedButton
                  minWidth={Spacing.extraExtraHuge}
                  selfAlign="center"
                  title={t("loginScreen.createAccount")}
                  onPress={navigateToSignup}
                />
                <SolidButton
                  left={Spacing.large}
                  minWidth={Spacing.extraExtraHuge}
                  selfAlign="center"
                  title={t("loginScreen.login")}
                  onPress={navigateToLogin}
                />
              </Row>
              </CardFooter>
            </Card>
          </If>

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
