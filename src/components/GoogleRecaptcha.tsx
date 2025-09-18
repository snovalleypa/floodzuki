import React, { useImperativeHandle, useRef } from "react"
import Recaptcha, { RecaptchaHandles } from "react-native-recaptcha-that-works";

import { Ternary } from "@common-ui/components/Conditional"
import { isWeb } from "@common-ui/utils/responsive"
import Constants from "expo-constants";
import { useFocusEffect } from "expo-router";
import { logError } from "@utils/sentry";

type GoogleRecaptchaProps = {
  onVerify: (token: string) => void,
  onExpire: () => void,
}

type WebRecpatcha = Pick<GoogleRecaptchaProps, "onVerify" | "onExpire">

const RECAPTCHA_KEY = Constants.expoConfig.extra.recaptchaKey

const WebRecpatcha = React.forwardRef(({
  onVerify,
  onExpire,
}: WebRecpatcha, ref) => {
  const isRendered = useRef(false)

  const uniqueId = Math.random().toString(36).substring(2, 15)

  useImperativeHandle(ref, () => ({
    open: () => {
      window.localRecaptchaCallback = (token: string) => {
        onVerify(token)
      }

      try {
        window.grecaptcha?.ready(function() {
          isRendered.current = true

          window.grecaptcha?.execute()
        })
      }
      catch (e) {
        logError(e)
      }
    },

    reset: () => {
      if (!isRendered.current) {
        return
      }
      
      window.grecaptcha?.reset()
    }
  }))

  return (
    <div
      id={`localRecaptchaContainer_${uniqueId}`}
      className="g-recaptcha"
      data-callback="localRecaptchaCallback"
      data-size="invisible"
      data-sitekey={RECAPTCHA_KEY}
    ></div>
  )
})

const GoogleRecaptcha = React.forwardRef((props: GoogleRecaptchaProps, ref) => {
  const { onVerify, onExpire } = props

  const recaptchaWeb = useRef<RecaptchaHandles>(null)
  const recaptcha = useRef<RecaptchaHandles>(null)

  useImperativeHandle(ref, () => ({
    open: () => {
      if (isWeb) {
        recaptchaWeb.current?.open()
        return
      }
      
      recaptcha.current?.open()
    },

    reset: () => {
      if (isWeb) {
        recaptchaWeb.current?.reset()
      }
    }
  }))

  // Reset recaptcha on focus
  useFocusEffect(() => {
    if (isWeb) {
      recaptchaWeb.current?.reset()
    }
  })

  return (
    <Ternary condition={isWeb}>
      <WebRecpatcha
        ref={recaptchaWeb}
        onVerify={onVerify}
        onExpire={onExpire}
      />
      <Recaptcha
        ref={recaptcha}
        siteKey={RECAPTCHA_KEY}
        baseUrl="http://floodzilla.com"
        size="invisible"
        theme="light"
        onExpire={onExpire}
        onVerify={onVerify}
      />
    </Ternary>
  )
})

export default GoogleRecaptcha
