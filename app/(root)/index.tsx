import React from "react"
import { Redirect } from "expo-router";
import { ROUTES } from "app/_layout";
import { useLocale } from "@common-ui/contexts/LocaleContext";
import Head from "expo-router/head";

export default function Index() {
  const { t } = useLocale();

  return (
    <>
      <Head>
        <title>{t("common.title")} - {t("homeScreen.title")}</title>
      </Head>
      <Redirect href={ROUTES.Gages} />
    </>
  );
};
