import React from "react";
import Head from "expo-router/head";

import { useLocale } from "@common-ui/contexts/LocaleContext";
import { isWeb } from "@common-ui/utils/responsive";

type PageTitleProps = {
  /** Page-specific name. When omitted, only the brand is shown. */
  name?: string;
};

/**
 * Sets the web document <title> in the format `{name} — {brand}`, where brand is
 * the localized app title (common.title). No-op on native — native navigation
 * titles are set per-screen via <Stack.Screen options={{ title }}>.
 */
export default function PageTitle({ name }: PageTitleProps) {
  const { t } = useLocale();

  if (!isWeb) {
    return null;
  }

  const brand = t("common.title");
  const title = name ? `${name} — ${brand}` : brand;

  return (
    <Head>
      <title>{title}</title>
    </Head>
  );
}
