import React from "react";

import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import BrokenAxis from "highcharts/modules/broken-axis";
import { isWeb } from "@common-ui/utils/responsive";
import { useLocaleContext } from "@common-ui/contexts/LocaleContext";
import { getHighchartsLang } from "@services/highcharts/highchartsLang";

export default function LocalHighchartsReact(props: HighchartsReact.Props) {
  if (isWeb) {
    BrokenAxis(Highcharts);
  }

  const { locale } = useLocaleContext();

  // Apply synchronously: Highcharts reads `lang` at chart construction, so a
  // useEffect (post-render) would be too late for the initial render's xAxis
  // labels. Re-applying every render is cheap — it just mutates globals.
  Highcharts.setOptions({ lang: getHighchartsLang(locale) });

  return <HighchartsReact highcharts={Highcharts} {...props} />;
}
