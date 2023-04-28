import { Instance, SnapshotOut, types } from "mobx-state-tree"
import { flow } from "mobx-state-tree"
import { dataFetchingProps, withDataFetchingActions } from "./helpers/withDataFetchingProps"
import { withSetPropAction } from "./helpers/withSetPropsAction"
import { ChangeEmailParams, CreateAccountParams, CreatePasswordParams, ForgotPasswordParams, LogInParams, NewSettingsParams, ProcessGoogleTokenParams, ResetPasswordParams, SendPhoneVerificationCodeParams, SetPasswordParams, UpdateProfileParams, VerifyEmailParams, VerifyPhoneParams, api } from "@services/api"
import { registerForPushNotificationsAsync } from "@services/pushNotifications"

// AuthSession

const SessionStateEnum = types.enumeration(["loggedIn", "notLoggedIn", "loggingIn", "loggingOut"])
export const SessionState = {
  loggedIn: "loggedIn",
  notLoggedIn: "notLoggedIn",
  loggingIn: "loggingIn",
  loggingOut: "loggingOut",
} as const

type AuthResult = {
  firstName: string,
  lastName: string,
  username: string,
  phone: string,
  token: string,
  isAdmin: boolean,
  loginProvider: string,
  hasPassword: boolean,
  emailVerified: boolean,
  phoneVerified: boolean,
}

const UserSettingsModel = types
  .model("UserSettings")
  .props({
    notifyDailyForecasts: types.maybe(types.boolean),
    notifyForecastAlerts: types.maybe(types.boolean),
    notifyViaEmail: types.maybe(types.boolean),
    notifyViaSms: types.maybe(types.boolean),
  })

export const UserModel = types
  .model("User")
  .props({
    username: types.identifier,
    firstName: types.maybeNull(types.string),
    lastName: types.maybeNull(types.string),
    phone: types.maybeNull(types.string),
    loginProvider: types.maybeNull(types.string),
    token: types.maybeNull(types.string),
    isAdmin: types.maybe(types.boolean),
    hasPassword: types.maybe(types.boolean),
    emailVerified: types.maybe(types.boolean),
    phoneVerified: types.maybe(types.boolean),
  })
  .views(store => ({
    get email() {
      return store.username
    }
  }))

export const AuthSessionStoreModel = types
  .model("AuthSessionStore")
  .props({
    sessionState: types.maybe(SessionStateEnum),
    user: types.maybe(UserModel),
    userSettings: types.maybeNull(UserSettingsModel),
    authToken: types.maybe(types.string),
    loginProvider: types.maybeNull(types.string),
    gageSubscriptions: types.optional(types.array(types.string), []),
    isPushNotificationsEnabled: types.optional(types.boolean, false),
    pushToken: types.maybe(types.string),
    ...dataFetchingProps
  })
  .actions(withDataFetchingActions)
  .actions(withSetPropAction)
  .views(store => ({
    get isNotificationsEnabled() {
      return store.userSettings?.notifyViaEmail ||
        store.userSettings?.notifyViaSms
    },

    get isLoggedIn() {
      return store.sessionState === SessionState.loggedIn
    },

    get hasLoginProvider() {
      return !!store.loginProvider
    },

    get isEmailVerified() {
      return store.user?.emailVerified
    },

    get isPhoneVerified() {
      return store.user?.phoneVerified
    },

    get userPhone() {
      return store.user?.phone
    },

    get userEmail() {
      return store.user?.username
    },

    get userFirstName() {
      return store.user?.firstName
    },

    get userLastName() {
      return store.user?.lastName
    }
  }))
  .actions(store => {
    const onAuthenticate = (result: AuthResult) => {
      api.setHeader("Authorization", `Bearer ${result.token}`)

      store.setProp("authToken", result.token)
      store.setProp("loginProvider", result.loginProvider)
      store.setProp("user", result)
      store.setProp("sessionState", SessionState.loggedIn)
    }

    const removeAuthToken = () => {
      store.setProp("authToken", "")
      api.removeHeader("Authorization")
    }

    const onAuthFail = () => {
      removeAuthToken()
      store.setProp("sessionState", SessionState.notLoggedIn)
    }

    const logIn = flow(function*(params: LogInParams) {
      store.setIsFetching(true)

      const response = yield api.login(params)

      if (response.kind === 'ok') {
        onAuthenticate(response.data)
      } else {
        onAuthFail()
        store.setError(response.data ?? "Failed to log in")
      }

      store.setIsFetching(false)
    })

    const createAccount = flow(function*(params: CreateAccountParams) {
      store.setIsFetching(true)

      const response = yield api.createAccount(params)

      if (response.kind === 'ok') {
        onAuthenticate(response.data)
      } else {
        onAuthFail()
        store.setError(response.data ?? "Failed to create account. Please try again.")
      }

      store.setIsFetching(false)
    })

    const forgotPassword = flow(function*(params: ForgotPasswordParams) {
      store.setIsFetching(true)

      const response = yield api.forgotPassword(params)

      if (response.kind !== 'ok') {
        store.setError(response.data)
      }

      store.setIsFetching(false)
    })

    const setPassword = flow(function*(params: SetPasswordParams) {
      store.setIsFetching(true)

      const response = yield api.setPassword(params)

      if (response.kind !== 'ok') {
        store.setError(response.data)
      }

      store.setIsFetching(false)
    })

    // Not currently used
    const createPassword = flow(function*(params: CreatePasswordParams) {
      store.setIsFetching(true)

      const response = yield api.createPassword(params)

      if (response.kind === 'ok') {
        onAuthenticate(response.data)
      } else {
        store.setError(response.data)
      }

      store.setIsFetching(false)
    })

    const resetPassword = flow(function*(params: ResetPasswordParams) {
      store.setIsFetching(true)

      const response = yield api.resetPassword(params)

      if (response.kind !== 'ok') {
        store.setError(response.data)
      }

      store.setIsFetching(false)
    })

    const updateProfile = flow(function*(params: UpdateProfileParams) {
      store.setIsFetching(true)

      const response = yield api.updateProfile(params)

      if (response.kind === 'ok') {
        onAuthenticate(response.data)
      } else {
        store.setError(response.data)
      }

      store.setIsFetching(false)
    })

    // Not currently used
    const changeEmail = flow(function*(params: ChangeEmailParams) {
      store.setIsFetching(true)

      const response = yield api.changeEmail(params)

      if (response.kind === 'ok') {
        onAuthenticate(response.data)
      } else {
        store.setError(response.data)
      }

      store.setIsFetching(false)
    })

    const reauthenticate = flow(function*() {
      store.setIsFetching(true)
      
      if (!store.authToken) {
        store.setIsFetching(false)
        return
      }

      const response = yield api.reauthenticate()

      if (response.kind === 'ok') {
        onAuthenticate(response.data)
      } else {
        onAuthFail()
        store.setError(response.data)
      }

      store.setIsFetching(false)
    })

    const sendVerificationEmail = flow(function*() {
      store.setIsFetching(true)
      
      if (!store.authToken) {
        store.setIsFetching(false)
        return
      }

      const response = yield api.sendVerificationEmail()

      if (response.kind !== 'ok') {
        store.setError(response.data)
      }

      store.setIsFetching(false)
    })

    const verifyEmail = flow(function*(params: VerifyEmailParams) {
      store.setIsFetching(true)

      if (!store.authToken) {
        store.setIsFetching(false)
        return
      }

      const response = yield api.verifyEmail(params)

      if (response.kind === 'ok') {
        store.user.emailVerified = true
      } else {
        store.setError(response.data)
      }

      store.setIsFetching(false)
    })

    const sendPhoneVerificationCode = flow(function*(params: SendPhoneVerificationCodeParams) {
      store.setIsFetching(true)

      if (!store.authToken) {
        store.setIsFetching(false)
        return
      }

      const response = yield api.sendPhoneVerificationCode(params)

      if (response.kind !== 'ok') {
        store.setError(response.data)
      }

      store.setIsFetching(false)
    })

    const verifyPhoneCode = flow(function*(params: VerifyPhoneParams) {
      store.setIsFetching(true)

      if (!store.authToken) {
        store.setIsFetching(false)
        return
      }

      const response = yield api.verifyPhoneCode(params)

      if (response.kind === 'ok') {
        store.user.phone = params.phone
        store.user.phoneVerified = true
      } else {
        store.setError(response.data)
      }

      store.setIsFetching(false)
    })

    const processGoogleToken = flow(function*(params: ProcessGoogleTokenParams) {
      store.setIsFetching(true)

      const response = yield api.processGoogleToken(params)

      if (response.kind === 'ok') {
        onAuthenticate(response.data)
      } else {
        onAuthFail()
        store.setError(response.data)
      }

      store.setIsFetching(false)
    })

    const logOut = flow(function*() {
      removeAuthToken()
      store.setProp("sessionState", SessionState.notLoggedIn)

      // TODO: Handle google auth log out
    })

    const getSettings = flow(function*() {
      if (!store.authToken) return

      store.setIsFetching(true)

      const response = yield api.getSettings()

      if (response.kind === 'ok') {
        store.setProp("userSettings", response.data)
      } else {
        store.setError(response.data)
      }

      store.setIsFetching(false)
    })

    const updateSettings = flow(function*(params: NewSettingsParams) {
      store.setIsFetching(true)

      const response = yield api.updateSettings(params)

      if (response.kind === 'ok') {
        yield getSettings()
      } else {
        store.setError(response.data)
      }

      store.setIsFetching(false)
    })

    const getSubscribedGages = flow(function*() {
      if (!store.authToken) return

      store.setIsFetching(true)

      const response = yield api.getSubscribedGages()

      if (response.kind === 'ok') {
        store.setProp("gageSubscriptions", response.data)
      } else {
        store.setError(response.data)
      }

      store.setIsFetching(false)
    })

    const setGageSubscription = flow(function*(gageId: string, isSubscribed: boolean) {
      store.setIsFetching(true)

      const response = yield api.setGageSubscription(gageId, isSubscribed)

      if (response.kind === 'ok') {
        yield getSubscribedGages()
      } else {
        store.setError(response.data)
      }

      store.setIsFetching(false)
    })

    const unsubscribeFromNotifications = flow(function*(userId: string) {
      store.setIsFetching(true)

      const response = yield api.unsubscribeFromNotifications(userId)

      if (response.kind === 'ok') {
        yield getSettings()
      }
      else {
        store.setError(response.data)
      }

      store.setIsFetching(false)
    })

    const togglePushNotificationsEnabled = flow(function*() {
      const nextState = !store.isPushNotificationsEnabled
      const token = store.pushToken

      // If nextState is true, we need to register the token
      if (nextState) {
        // If there is no token, we need to register for push notifications
        if (!token) {
          const newToken = yield registerForPushNotificationsAsync()
          store.setProp("pushToken", newToken)

          if (!newToken) {
            return
          }
        }
      }
      else {
        // If nextState is false, we need to remove the token
        store.setProp("pushToken",  "")
      }

      store.isPushNotificationsEnabled = nextState
    })

    return {
      logIn,
      createAccount,
      forgotPassword,
      setPassword,
      createPassword,
      resetPassword,
      updateProfile,
      changeEmail,
      reauthenticate,
      sendVerificationEmail,
      verifyEmail,
      sendPhoneVerificationCode,
      verifyPhoneCode,
      processGoogleToken,
      logOut,
      getSettings,
      updateSettings,
      getSubscribedGages,
      setGageSubscription,
      unsubscribeFromNotifications,
      togglePushNotificationsEnabled
    }
  })

export interface AuthSessionStore extends Instance<typeof AuthSessionStoreModel> {}
export interface AuthSessionStoreSnapshot extends SnapshotOut<typeof AuthSessionStoreModel> {}

export interface User extends Instance<typeof UserModel> {}