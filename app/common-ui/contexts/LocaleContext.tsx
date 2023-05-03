import React, { useRef } from "react"
import "@i18n/i18n";
import { TxKeyPath, i18n } from "@i18n/i18n"
import { useStores } from "@models/helpers/useStores"
import localDayJs from "@services/localDayJs";


type LocaleContextType = {
  locale: string
  changeContextLocale: (locale: string) => void
  t: (key: TxKeyPath, options?: I18n.TranslateOptions) => string
}

const initialState: LocaleContextType = {
  locale: i18n.locale,
  changeContextLocale: () => {},
  t: (key: TxKeyPath, options?: I18n.TranslateOptions) => key,
}

const LocaleContext = React.createContext<LocaleContextType>(initialState)

export const useLocaleContext = () => React.useContext(LocaleContext)

export const useLocale = () => {
  const { t, changeContextLocale } = useLocaleContext()
  const { authSessionStore } = useStores()

  const changeLocale = (locale: string) => {
    changeContextLocale(locale)
    localDayJs.locale(locale)
    authSessionStore.setPrefferedLocale(locale)
  }

  return { t, changeLocale }
}

export const LocaleProvider = ({ children }: { children: React.ReactNode }) => {
  const localI18n = useRef(i18n)
  const [locale, setLocale] = React.useState(i18n.locale)

  const changeContextLocale = (locale: string) => {
    localI18n.current.locale = locale
    setLocale(locale)
  }

  const t = (key: TxKeyPath, options?: I18n.TranslateOptions) => localI18n.current.t(key, options)

  return (
    <LocaleContext.Provider value={{ locale, changeContextLocale, t }}>
      {children}
    </LocaleContext.Provider>
  )
}