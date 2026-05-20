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

export interface StubChangesInput {
  gages: readonly { locationId?: string; _isStub?: boolean }[];
  locationInfos: readonly { id: string; isMetagage?: boolean }[];
  showHidden: boolean;
}

export interface StubChanges {
  toAdd: string[];
  toRemove: string[];
}

export function computeStubChanges({
  gages,
  locationInfos,
  showHidden,
}: StubChangesInput): StubChanges {
  const realGageIds = new Set<string>();
  const existingStubIds = new Set<string>();
  for (const g of gages) {
    if (!g.locationId) {
      continue;
    }
    if (g._isStub) {
      existingStubIds.add(g.locationId);
    } else {
      realGageIds.add(g.locationId);
    }
  }

  if (!showHidden) {
    return { toAdd: [], toRemove: [...existingStubIds] };
  }

  const wantStubIds = new Set<string>();
  for (const l of locationInfos) {
    if (!l.isMetagage && !realGageIds.has(l.id)) {
      wantStubIds.add(l.id);
    }
  }

  const toAdd: string[] = [];
  for (const id of wantStubIds) {
    if (!existingStubIds.has(id)) {
      toAdd.push(id);
    }
  }
  const toRemove: string[] = [];
  for (const id of existingStubIds) {
    if (!wantStubIds.has(id)) {
      toRemove.push(id);
    }
  }
  return { toAdd, toRemove };
}

/** Snapshot shape used to push a stub gage into GageStore.gages. */
export function makeStubSnapshot(locationId: string) {
  return {
    locationId,
    locationInfo: locationId,
    isOffline: true,
    _isStub: true,
  };
}
