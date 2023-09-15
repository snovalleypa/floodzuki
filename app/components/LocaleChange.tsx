import { Cell, Row } from "@common-ui/components/Common";
import Icon from "@common-ui/components/Icon";
import { LabelText } from "@common-ui/components/Text";
import { Colors } from "@common-ui/constants/colors";
import { Spacing } from "@common-ui/constants/spacing";
import { useLocale } from "@common-ui/contexts/LocaleContext";
import { useStores } from "@models/helpers/useStores";
import React from "react"
import { TouchableOpacity } from "react-native";

const LocaleChange = () => {
  const { authSessionStore } = useStores();
  const { changeLocale } = useLocale();

  const language = authSessionStore.userLocale
  const languageTitle = language.match("en") ? "Español" : "English"

  const toggleLanguage = () => {
    const nextLocale = language.match("en") ? "es" : "en"

    changeLocale(nextLocale)
  }

  return (
    <TouchableOpacity onPress={toggleLanguage}>
      <Row>
        <Icon name="globe" size={Spacing.medium} color={Colors.darkGrey} />
        <Cell left={Spacing.tiny}>
          <LabelText>{languageTitle}</LabelText>
        </Cell>
      </Row>
    </TouchableOpacity>
  )
}

export default LocaleChange
