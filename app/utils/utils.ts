/**
 * Generic formatting utils
 */

import { t } from "@i18n/translate";

export function formatHeight(height) {
  return height?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ` ${t("measure.ft")}`;
}

export function formatFlow(flow) {
  return flow?.toLocaleString(undefined, { maximumFractionDigits: 0 }) + ` ${t("measure.cfs")}`;
}

export function formatTrend(trend) {
  return trend?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ` ${t("measure.ft")}/${t("measure.hr")}`;
}

export function formatFlowTrend(trend) {
  let fmtTrend = trend?.toLocaleString(undefined, { maximumFractionDigits: 0 })
  if (trend > 0) {
    fmtTrend = "+" + fmtTrend
  }
  return fmtTrend + ` ${t("measure.ft")}/${t("measure.hr")}`;
}

export function isNullish(value) {
  return value === null || value === undefined;
}
