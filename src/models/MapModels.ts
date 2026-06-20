import { Gage } from "./Gage";
import { Region } from "./Region";

// Half-extents (in degrees) of the bounding box used to frame a single gauge on
// the details map. maplibre fits this box to the container, so larger values zoom
// out. Shared by the web and native maps so they stay in sync (they had drifted
// apart). The values were chosen by trial and error to be roughly square and to
// show the gauge and enough surrounding context to include a couple of local towns
// for most gauges.
export const SINGLE_GAGE_LAT_DELTA = 0.06;
export const SINGLE_GAGE_LNG_DELTA = 0.09;

export type GageMapProps = {
  onGagePress: (gage: Gage) => void;
  region: Region;
  gages: Gage[];
  // When explicitly false, disables the accidental-scroll protection so a single
  // finger pans the map (used by the full-screen Map tab). Defaults to the
  // existing per-platform behavior when omitted.
  cooperativeGestures?: boolean;
  // When set, the map renders a translucent flood-inundation fill for this URL,
  // beneath the river/town overlays. Null/undefined renders none.
  inundationUrl?: string | null;
  // Called when the inundation GeoJSON source has finished loading into the map.
  // Web fires it from the source-loaded event; native from the first
  // fully-rendered frame after the URL is set. The screen also keeps a timeout
  // fallback so the loading state never hangs.
  onInundationLoad?: () => void;
  // Called when the inundation GeoJSON fails to load (e.g. the URL 404s or the
  // network is down). Web fires it from the map error event; native from a HEAD
  // probe of the URL.
  onInundationError?: () => void;
};

export type InternalGageMapProps = GageMapProps & {
  singleGage: Gage | null;
};
