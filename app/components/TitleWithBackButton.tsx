import React from "react"

import { IconButton, LinkButton } from "@common-ui/components/Button";
import { Row } from "@common-ui/components/Common";
import { If, Ternary } from "@common-ui/components/Conditional";
import { LargeTitle } from "@common-ui/components/Text";
import { Colors } from "@common-ui/constants/colors";
import { Spacing } from "@common-ui/constants/spacing";
import { useResponsive } from "@common-ui/utils/responsive";

import { t } from "@i18n/translate";

type TitleWithBackButtonProps = {
  title: string
  onPress: () => void
  webEnabled?: boolean
  mobileEnabled?: boolean
}

const TitleWithBackButton = ({
  title,
  webEnabled = true,
  mobileEnabled = true,
  onPress
}: TitleWithBackButtonProps) => {
  const { isMobile } = useResponsive()
  
  return (
    <Row left={Spacing.medium} bottom={Spacing.extraSmall} top={Spacing.medium}>
      <Ternary condition={isMobile}>
        <If condition={mobileEnabled}>
          <IconButton
            left={-Spacing.medium}
            icon="chevron-left"
            onPress={onPress} />
        </If>
        <If condition={webEnabled}>
          <LinkButton
            left={-Spacing.medium}
            title={t("navigation.back")}
            leftIcon="chevron-left"
            textColor={Colors.blue}
            onPress={onPress}
          />
        </If>
      </Ternary>
      <LargeTitle>
        {title}
      </LargeTitle>
    </Row>
  )
}

export default TitleWithBackButton
