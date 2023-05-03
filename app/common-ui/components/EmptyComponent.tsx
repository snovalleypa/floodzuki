import React from "react"
import { Cell } from "./Common"
import { RegularText } from "./Text"
import { useLocale } from "@common-ui/contexts/LocaleContext";

const EmptyComponent = () => {
  const { t } = useLocale();
  
  return (
    <Cell flex align="center" justify="center">
      <RegularText>{t("common.loading")}</RegularText>
    </Cell>
  )
}

export default EmptyComponent
