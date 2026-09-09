import { useEffect, useState } from "react";
import { fetchInundationConfig, type InundationLevel } from "./inundationOverlay";

export type InundationLevelsState = {
  // The region's levels, or null when there is no usable config (control hidden).
  levels: InundationLevel[] | null;
  // Outline of the 2D model's boundary, or null when the config doesn't list one.
  modelBoundaryUrl: string | null;
  // False until the first fetch for the current region settles, so the caller can
  // avoid flashing the control on while the config is still loading.
  ready: boolean;
};

// Load the per-region Flood Visualizer config from GCS. Refetches when the
// region changes; a stale in-flight response is ignored.
export function useInundationLevels(regionId: number | undefined): InundationLevelsState {
  const [state, setState] = useState<InundationLevelsState>({
    levels: null,
    modelBoundaryUrl: null,
    ready: false,
  });

  useEffect(() => {
    if (regionId === undefined) {
      setState({ levels: null, modelBoundaryUrl: null, ready: false });
      return undefined;
    }
    let cancelled = false;
    setState({ levels: null, modelBoundaryUrl: null, ready: false });
    fetchInundationConfig(regionId)
      .then((config) => {
        if (!cancelled) {
          setState({
            levels: config?.levels ?? null,
            modelBoundaryUrl: config?.modelBoundaryUrl ?? null,
            ready: true,
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState({ levels: null, modelBoundaryUrl: null, ready: true });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [regionId]);

  return state;
}
