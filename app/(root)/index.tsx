import React from "react"
import { Redirect, Stack } from "expo-router";
import { ROUTES } from "app/_layout";
import { useLocale } from "@common-ui/contexts/LocaleContext";

export default function Index() {
  const { t } = useLocale();

  return (
    <>
      <Stack.Screen options={{ title: `${t("common.title")} - ${t("homeScreen.title")}` }} />
      <Redirect href={ROUTES.Gages} />
    </>
  );
};
