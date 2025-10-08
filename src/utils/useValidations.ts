import { useLocale } from "@common-ui/contexts/LocaleContext"
import { useEffect, useState } from "react"

const VALIDATIONS = {
  presence: (fieldName: string, value: string, t) => {
    return value.length > 0 ? true : t("validations.presence", { fieldName })
  }
}

export const useValidations = (values: Record<string, any>) => {
  const { t } = useLocale()
  const [isValid, setIsValid] = useState(false)
  const [errors, setErrorMessages] = useState<string>()

  const validate = (values: Record<string, any>) => {
    const errors: Record<string, string> = {}

    Object.keys(values).forEach(key => {
      const value = values[key]
      const validation = VALIDATIONS.presence

      if (validation) {
        const error = validation(key, value, t)

        if (typeof error !== "boolean") {
          errors[key] = error
        }
      }
    })

    setIsValid(Object.keys(errors).length === 0)
    setErrorMessages(Object.values(errors).join(", "))
  }
  
  useEffect(() => {
    validate(values)
  }, [values])

  return [isValid, errors] as const
}