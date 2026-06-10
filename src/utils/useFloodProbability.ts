import { useEffect, useState } from "react";

import { getFloodProbability } from "@services/floodPrediction/floodPredictionService";
import { FloodProbabilityResult } from "@services/floodPrediction/types";

/**
 * Fetches and computes the flood probability for a gauge (by locationId).
 * Returns null for gauges not covered by the prediction constants. Kept out of
 * MobX-State-Tree so the bulky rating-table / quantile payloads never enter the
 * persisted RootStore snapshot.
 */
export function useFloodProbability(locationId?: string) {
  const [result, setResult] = useState<FloodProbabilityResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    if (locationId) {
      setLoading(true);
      getFloodProbability(locationId)
        .then((r) => {
          if (active) {
            setResult(r);
          }
        })
        .catch(() => {
          if (active) {
            setResult(null);
          }
        })
        .finally(() => {
          if (active) {
            setLoading(false);
          }
        });
    } else {
      setResult(null);
    }

    return () => {
      active = false;
    };
  }, [locationId]);

  return { result, loading };
}
