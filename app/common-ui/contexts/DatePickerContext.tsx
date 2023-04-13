import React from "react"

type DatePickerContextType = {
  isVisible: boolean
  showPicker: (content: React.ReactNode) => void
  hidePicker: () => void
}

export const DatePickerContext = React.createContext<DatePickerContextType>({
  isVisible: false,
  showPicker: () => {},
  hidePicker: () => {},
})

export const useDatePicker = () => React.useContext(DatePickerContext)

export const DatePickerProvider = ({ children }: { children: React.ReactNode }) => {
  const [isVisible, setIsVisible] = React.useState(false)
  const [content, setContent] = React.useState<React.ReactNode>(null)

  const showPicker = (content: React.ReactNode) => {
    setContent(content)
    setIsVisible(true)
  }

  const hidePicker = () => {
    setIsVisible(false)
    setContent(null)
  }

  return (
    <DatePickerContext.Provider value={{ isVisible, showPicker, hidePicker }}>
      {children}
      {isVisible && content}
    </DatePickerContext.Provider>
  )
}
