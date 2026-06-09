import React from "react";
import { Redirect } from "expo-router";
import { ROUTES } from "app/_layout";
import { useLocale } from "@common-ui/contexts/LocaleContext";
import PageTitle from "@common-ui/components/PageTitle";

export default function Index() {
  const { t } = useLocale();

  return (
    <>
      <PageTitle name={t("pageTitles.gageList")} />
      <Redirect href={ROUTES.Gages} />
    </>
  );
}
