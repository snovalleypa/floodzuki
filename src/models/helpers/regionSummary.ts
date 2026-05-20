export type ForecastSeverity = "none" | "near" | "flood";

export interface ForecastSeverityInput {
  peaks?: { waterDischarge?: number | null }[];
  dischargeStageOne?: number;
  dischargeStageTwo?: number;
}

export function computeForecastSeverity(forecasts: ForecastSeverityInput[]): ForecastSeverity {
  let hasNear = false;
  for (const forecast of forecasts) {
    const { peaks, dischargeStageOne, dischargeStageTwo } = forecast;
    for (const peak of peaks ?? []) {
      const q = peak.waterDischarge;
      if (q == null) {
        continue;
      }
      if (dischargeStageTwo && q >= dischargeStageTwo) {
        return "flood";
      }
      if (dischargeStageOne && q >= dischargeStageOne) {
        hasNear = true;
      }
    }
  }
  return hasNear ? "near" : "none";
}
