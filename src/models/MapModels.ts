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
};

export type InternalGageMapProps = GageMapProps & {
  singleGage: Gage | null;
};
