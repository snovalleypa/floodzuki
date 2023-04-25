import React, { useEffect, useRef, useState } from "react"

const VALIDATIONS = {
  presence: (fieldName: string, value: string) => {
    return value.length > 0 ? true : `${fieldName} can't be blank`
  }
}

export const useValidations = (values: Record<string, any>) => {
  const [isValid, setIsValid] = useState(false)
  const [errors, setErrorMessages] = useState<string>()

  const validate = (values: Record<string, any>) => {
    const errors: Record<string, string> = {}

    Object.keys(values).forEach(key => {
      const value = values[key]
      const validation = VALIDATIONS.presence

      if (validation) {
        const error = validation(key, value)

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