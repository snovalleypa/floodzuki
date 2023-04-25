import React, { useEffect, useImperativeHandle, useRef, useState } from "react"
import Recaptcha, { RecaptchaHandles } from "react-native-recaptcha-that-works";

import { Ternary } from "@common-ui/components/Conditional"
import { isWeb } from "@common-ui/utils/responsive"
import Constants from "expo-constants";

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
  const [rendered, setRendered] = useState(false)

  console.log("RENDERED", rendered)

  useImperativeHandle(ref, () => ({
    open: () => {
      console.log("OPENING RECAPTCHA", window.grecaptcha)
      window.localRecaptchaCallback = (token: string) => {
        onVerify(token)
      }

      if (!rendered) {
        try {
          console.log("OPENING RECAPTCHA", window.grecaptcha)
          window.grecaptcha?.ready(function() {
            console.log("RENDERING RECAPTCHA", RECAPTCHA_KEY)
            window.grecaptcha?.render(document.getElementById('localRecaptchaContainer'), {
              sitekey: RECAPTCHA_KEY,
            }, true);

            setRendered(true)

            window.grecaptcha?.execute()
          })
        }
        catch (e) {
          // Most likely the recaptcha script has been already rendered
          // so we can ignore this error
          console.log("Error rendering recaptcha", e)
        }

        return
      }
      
      console.log("EXECUTING RECAPTCHA", window.grecaptcha)

      window.grecaptcha?.execute()
    },

    reset: () => {
      if (!rendered) return

      window.grecaptcha?.reset()
    }
  }))

  return (
    <div
      id='localRecaptchaContainer'
      // className="g-recaptcha"
      data-callback="localRecaptchaCallback"
      data-size="invisible"
      data-sitekey=""
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
