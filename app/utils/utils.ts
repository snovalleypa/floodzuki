/**
 * Generic formatting utils
 */

export function formatHeight(height) {
  return height?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ft";
}

export function formatFlow(flow) {
  return flow?.toLocaleString(undefined, { maximumFractionDigits: 0 }) + " cfs";
}

export function formatTrend(trend) {
  return trend?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ft/hr";
}

export function formatFlowTrend(trend) {
  let fmtTrend = trend?.toLocaleString(undefined, { maximumFractionDigits: 0 })
  if (trend > 0) {
    fmtTrend = "+" + fmtTrend
  }
  return fmtTrend + " cfs/hr";
}

export function isNullish(value) {
  return value === null || value === undefined;
}
