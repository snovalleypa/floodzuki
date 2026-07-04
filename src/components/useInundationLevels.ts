import { useEffect, useState } from "react";
import { fetchInundationLevels, type InundationLevel } from "./inundationOverlay";

export type InundationLevelsState = {
  // The region's levels, or null when there is no usable config (control hidden).
  levels: InundationLevel[] | null;
  // False until the first fetch for the current region settles, so the caller can
  // avoid flashing the control on while the config is still loading.
  ready: boolean;
};

// Load the per-region Flood Visualizer level config from GCS. Refetches when the
// region changes; a stale in-flight response is ignored.
export function useInundationLevels(regionId: number | undefined): InundationLevelsState {
  const [state, setState] = useState<InundationLevelsState>({ levels: null, ready: false });

  useEffect(() => {
    if (regionId === undefined) {
      setState({ levels: null, ready: false });
      return undefined;
    }
    let cancelled = false;
    setState({ levels: null, ready: false });
    fetchInundationLevels(regionId)
      .then((levels) => {
        if (!cancelled) {
          setState({ levels, ready: true });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState({ levels: null, ready: true });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [regionId]);

  return state;
}
