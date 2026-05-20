import React from "react";

import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import BrokenAxis from "highcharts/modules/broken-axis";
import { isWeb } from "@common-ui/utils/responsive";
import { useLocaleContext } from "@common-ui/contexts/LocaleContext";
import { getHighchartsLang } from "@services/highcharts/highchartsLang";
import { TOOLTIP_CSS, TOOLTIP_STYLE_ELEMENT_ID } from "@services/highcharts/tooltipStyles";

// Web mounts Highcharts directly in the main DOM, so the tooltip CSS defined
// in the WebView shell (HighchartsLayout.tsx) does not reach it. Inject the
// same rules into document.head, idempotently by id.
if (isWeb && typeof document !== "undefined") {
  if (!document.getElementById(TOOLTIP_STYLE_ELEMENT_ID)) {
    const styleEl = document.createElement("style");
    styleEl.id = TOOLTIP_STYLE_ELEMENT_ID;
    styleEl.textContent = TOOLTIP_CSS;
    document.head.appendChild(styleEl);
  }
}

export default function LocalHighchartsReact(props: HighchartsReact.Props) {
  if (isWeb) {
    BrokenAxis(Highcharts);
  }

  const { locale } = useLocaleContext();

  // Apply synchronously: Highcharts reads `lang` at chart construction, so a
  // useEffect (post-render) would be too late for the initial render's xAxis
  // labels. Re-applying every render is cheap — it just mutates globals.
  //
  // The tooltip formatter mirrors the one installed inside the WebView shell
  // (HighchartsLayout.tsx) for native: read precomputed point.options.tooltipHtml
  // rather than computing at render time, so both platforms render identically.
  Highcharts.setOptions({
    lang: getHighchartsLang(locale),
    tooltip: {
      useHTML: true,
      formatter: function (this: Highcharts.TooltipFormatterContextObject) {
        return (this.point?.options as { tooltipHtml?: string })?.tooltipHtml || "";
      },
    },
  });

  return <HighchartsReact highcharts={Highcharts} {...props} />;
}
