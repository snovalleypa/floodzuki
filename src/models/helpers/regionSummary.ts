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

export interface BucketCountsInput {
  gages: readonly {
    locationId?: string;
    _isStub?: boolean;
    gageStatus?: { floodLevel?: string };
  }[];
  locationInfos: readonly { id: string; isMetagage?: boolean }[];
}

export interface BucketCounts {
  active: number;
  visibleOffline: number;
  hidden: number;
  flooding: number;
  nearFlooding: number;
}

export function computeBucketCounts({ gages, locationInfos }: BucketCountsInput): BucketCounts {
  let active = 0;
  let visibleOffline = 0;
  let flooding = 0;
  let nearFlooding = 0;
  const realGageIds = new Set<string>();

  for (const g of gages) {
    if (g._isStub) {
      continue;
    }
    if (g.locationId) {
      realGageIds.add(g.locationId);
    }
    const level = g.gageStatus?.floodLevel;
    if (level === "Offline") {
      visibleOffline++;
    } else {
      active++;
    }
    if (level === "Flooding") {
      flooding++;
    } else if (level === "NearFlooding") {
      nearFlooding++;
    }
  }

  let hidden = 0;
  for (const l of locationInfos) {
    if (l.isMetagage) {
      continue;
    }
    if (!realGageIds.has(l.id)) {
      hidden++;
    }
  }

  return { active, visibleOffline, hidden, flooding, nearFlooding };
}
