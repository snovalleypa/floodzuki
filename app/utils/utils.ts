/**
 * Generic formatting utils
 */

import { useLocale } from "@common-ui/contexts/LocaleContext";

export const useUtils = () => {
  const { t } = useLocale();

  function formatHeight(height) {
    return height?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ` ${t("measure.ft")}`;
  }
  
  function formatFlow(flow) {
    return flow?.toLocaleString(undefined, { maximumFractionDigits: 0 }) + ` ${t("measure.cfs")}`;
  }
  
  function formatTrend(trend) {
    return trend?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ` ${t("measure.ft")}/${t("measure.hr")}`;
  }
  
  function formatFlowTrend(trend) {
    let fmtTrend = trend?.toLocaleString(undefined, { maximumFractionDigits: 0 })
    if (trend > 0) {
      fmtTrend = "+" + fmtTrend
    }
    return fmtTrend + ` ${t("measure.cfs")}/${t("measure.hr")}`;
  }
  
  return {
    formatHeight,
    formatFlow,
    formatTrend,
    formatFlowTrend,
  } as const
}

export function isNullish(value) {
  return value === null || value === undefined;
}
