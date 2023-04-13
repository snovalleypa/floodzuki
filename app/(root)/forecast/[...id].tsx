import React from "react"
import { ErrorBoundaryProps, useSearchParams, Stack, useRouter } from "expo-router";

import { Content, Screen } from "@common-ui/components/Screen"
import { LargeTitle } from "@common-ui/components/Text"
import { ErrorDetails } from "@components/ErrorDetails";
import { ForecastChart } from "@components/ForecastChart";
import { ExtendedGageSummaryCard, GageSummaryCard } from "@components/GageSummaryCard";
import { Cell, Row } from "@common-ui/components/Common";
import { Spacing } from "@common-ui/constants/spacing";

import { useStores } from "@models/helpers/useStores";
import { t } from "@i18n/translate";
import { useResponsive } from "@common-ui/utils/responsive";
import { IconButton, LinkButton } from "@common-ui/components/Button";
import { Ternary } from "@common-ui/components/Conditional";
import { Colors } from "@common-ui/constants/colors";
import { useTimeout } from "@utils/useTimeout";
import { GageSummary } from "@models/RootStore";
import { ROUTES } from "app/_layout";
import { observer } from "mobx-react-lite";

// We use this to wrap each screen with an error boundary
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorDetails {...props} />;
}

const ForecastDetailsScreen = observer(
  function ForecastDetailsScreen() {
    const { id } = useSearchParams()
    const router = useRouter()
    const store = useStores()

    const { isMobile } = useResponsive()

    // Pathname id can either be a simple gage like "USGS-38"
    // or a nested gage like "USGS-SF17/USGS-38-0001" which will be
    // represented as an array of strings ["USGS-SF17", "USGS-38-0001"]
    const gageId = Array.isArray(id) ? id.join("/") : id

    const [hidden, setHidden] = React.useState(true)

    useTimeout(() => {
      setHidden(false)
    }, 0)

    const forecastGage = hidden ? {} as GageSummary : store.getForecastGage(gageId)

    const goBack = () => {
      router.push({ pathname: ROUTES.Forecast })
    }

    return (
      <Screen>
        <Stack.Screen options={{ title: `${t("common.title")} - ${t("forecastScreen.title")}: ${forecastGage?.title}` }} />
        <Row left={Spacing.medium} top={Spacing.medium}>
          <Ternary condition={isMobile}>
            <IconButton
              left={-Spacing.medium}
              icon="chevron-left"
              onPress={goBack} />
            <LinkButton
              left={-Spacing.medium}
              title={t("navigation.back")}
              leftIcon="chevron-left"
              textColor={Colors.blue}
              onPress={goBack}
            />
          </Ternary>
          <LargeTitle>
            {forecastGage?.title}
          </LargeTitle>
        </Row>
        <Content scrollable>
          <ForecastChart gages={[forecastGage]} />
          <Cell top={Spacing.mediumXL}>
            <GageSummaryCard
              firstItem
              noDetails
              gage={forecastGage}
            />
          </Cell>
          <Cell top={Spacing.mediumXL}>
            <ExtendedGageSummaryCard gage={forecastGage} />
          </Cell>
        </Content>
      </Screen>
    )
  }
)

export default ForecastDetailsScreen
