import React from "react";
import { usePathname } from "expo-router";

type DatePickerContextType = {
  isVisible: boolean;
  showPicker: (content: React.ReactNode) => void;
  hidePicker: () => void;
};

export const DatePickerContext = React.createContext<DatePickerContextType>({
  isVisible: false,
  showPicker: () => {},
  hidePicker: () => {},
});

export const useDatePicker = () => React.useContext(DatePickerContext);

export const DatePickerProvider = ({ children }: { children: React.ReactNode }) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const [content, setContent] = React.useState<React.ReactNode>(null);

  const pathname = usePathname();

  const hidePicker = React.useCallback(() => {
    setIsVisible(false);
    setContent(null);
  }, []);

  const showPicker = React.useCallback((newContent: React.ReactNode) => {
    setContent(newContent);
    setIsVisible(true);
  }, []);

  React.useEffect(() => {
    hidePicker();
  }, [pathname, hidePicker]);

  return (
    <DatePickerContext.Provider value={{ isVisible, showPicker, hidePicker }}>
      {children}
      {isVisible && content}
    </DatePickerContext.Provider>
  );
};
