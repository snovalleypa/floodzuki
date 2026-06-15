import Config from "@config/config";
import { ChartColorsHex } from "@common-ui/constants/colors";

export interface ForecastGroup {
  // Ordered ids for the page group (top-level order, or fork S->M->N order).
  ids: string[];
  // Where the back button falls back to when the native stack can't go back.
  backRoute: { pathname: string; params: Record<string, any> | undefined };
}

/** All component fork ids across every metagage, flattened (display order). */
function allForkComponents(): string[] {
  return Object.values(Config.FORECAST_METAGAGE_COMPONENTS).flat();
}

/**
 * Ids the forecast store must fetch: the top-level display ids first (so their
 * colors stay stable) followed by each metagage's component forks. Deduped.
 */
export function getForecastFetchIds(): string[] {
  const ordered = [...Config.FORECAST_GAGE_IDS, ...allForkComponents()];
  return Array.from(new Set(ordered));
}

/**
 * Resolve which page-group a forecast id belongs to: the top-level group
 * (metagage + Falls + Carnation) or a per-metagage fork group. Returns null for
 * ids that are neither, so callers can fall back to a standalone page.
 */
export function findForecastGroup(gageId: string): ForecastGroup | null {
  // Lazy-require to avoid pulling native bottom-sheet/reanimated modules into
  // the module graph at import time (which breaks Jest for any file that
  // transitively imports forecastGroups).
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { ROUTES } = require("app/_layout") as { ROUTES: Record<string, string> };

  if (Config.FORECAST_GAGE_IDS.includes(gageId)) {
    return {
      ids: Config.FORECAST_GAGE_IDS,
      backRoute: { pathname: ROUTES.Forecast, params: undefined },
    };
  }

  for (const [metagageId, components] of Object.entries(Config.FORECAST_METAGAGE_COMPONENTS)) {
    if (components.includes(gageId)) {
      return {
        ids: components,
        backRoute: {
          pathname: ROUTES.ForecastDetails,
          params: { id: metagageId.split("/") },
        },
      };
    }
  }

  return null;
}

/**
 * Deterministic id -> chart color. Keyed by config order (top-level first, then
 * forks) rather than API response order so the 6 series get stable, distinct
 * colors and existing top-level colors never shift.
 */
export function buildForecastColorMap(): Record<string, string> {
  const map: Record<string, string> = {};
  getForecastFetchIds().forEach((id, i) => {
    map[id] = ChartColorsHex[i % ChartColorsHex.length];
  });
  return map;
}
