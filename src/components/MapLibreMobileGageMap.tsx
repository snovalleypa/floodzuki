import {
  InternalGageMapProps,
  SINGLE_GAGE_LAT_DELTA,
  SINGLE_GAGE_LNG_DELTA,
} from "@models/MapModels";
import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, GeoJSONSource, Layer, Map, Marker } from "@maplibre/maplibre-react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import { StyleSheet, ViewStyle } from "react-native";
import { Spacing } from "../common-ui/constants/spacing";
import TrendIcon, { TREND_ICON_TYPES } from "./TrendIcon";
import { getTownLabelsGeoJson, TOWN_LABELS_LAYER_PROPS } from "./townLabels";
import { getRiverOverlaysGeoJson, RIVER_OVERLAY_LAYER_PROPS } from "./riverOverlays";
import { INUNDATION_FILL_LAYER_PROPS } from "./inundationOverlay";
import { ROAD_CLOSURE_LINE_LAYER_PROPS, ROAD_CLOSURE_LABEL_LAYER_PROPS } from "./roadClosures";
import Config from "../config/config";
import Constants from "expo-constants";
import floodzillaLocalStyle from "./mapStyles/floodzilla-webstyles.json";

const mapStyleBaseUrl =
  Constants.expoConfig!.extra!.mapTileUrlBase || Config.DEFAULT_MAP_TILE_BASE_URL;

const useLocalMapStyle = Boolean(Constants.expoConfig!.extra!.mapStyleLocal);

const styles = StyleSheet.create({
  map: {
    width: "100%",
    height: "100%",
    borderRadius: Spacing.tiny,
    overflow: "hidden",
  },
  marker: {
    width: 50,
    height: 50,
    cursor: "pointer",
  },
  markerImage: {
    width: 50,
    height: 50,
    cursor: "pointer",
  },
});

// These should never get used, since the region should have them, but we should have a
// fallback.  This map library expects bounds to be in [west, south, east, north] order.
const defaultRegionBounds = [-122.4, 46.9, -120.9, 48.4];
const defaultMapBounds = [-122.3328, 46.9564, -121.2959, 48.3127];

const singleGageLatDelta = SINGLE_GAGE_LAT_DELTA;
const singleGageLngDelta = SINGLE_GAGE_LNG_DELTA;

const MapLibreMobileGageMap = ({
  gages,
  region,
  onGagePress,
  singleGage,
  useCooperativeGestures,
  inundationUrl,
  onInundationLoad,
  onInundationError,
  roadClosuresUrl,
}: InternalGageMapProps) => {
  const mapRef = useRef(null);

  // Native has no per-source error event either, so probe the URL with a cheap
  // HEAD request when it's set (no CORS on native). A non-OK status or network
  // failure means the geojson won't load, so report the error. `cancelled` guards
  // against a stale response after the selection changed.
  useEffect(() => {
    if (!inundationUrl) {
      return undefined;
    }
    let cancelled = false;
    fetch(inundationUrl, { method: "HEAD" })
      .then((res) => {
        if (!cancelled && !res.ok) {
          onInundationError?.();
        }
      })
      .catch(() => {
        if (!cancelled) {
          onInundationError?.();
        }
      });
    return () => {
      cancelled = true;
    };
    // onInundationError is a stable callback from the screen; we only re-probe on URL change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inundationUrl]);

  // Native has no per-source "loaded" event, so we infer it from frame rendering:
  // `onDidFinishRenderingFrameFully` fires only when a frame renders with no
  // pending sources/tiles. We arm this ref whenever a new inundation URL is set;
  // the first fully-rendered frame after that means the polygon has loaded and
  // drawn, so we clear the loading state then (rather than waiting on the screen's
  // 12s timeout fallback). Subsequent frames (panning, etc.) are ignored.
  const awaitingInundationRender = useRef(false);
  useEffect(() => {
    awaitingInundationRender.current = Boolean(inundationUrl);
  }, [inundationUrl]);

  // The map lives inside a vertically-scrolling list, so a one-finger drag should
  // scroll the page rather than pan the map. We keep panning disabled until two or
  // more fingers are down, giving "cooperative gestures": one finger = page scroll,
  // two fingers = pan/zoom the map. (Pinch-zoom via `touchZoom` is inherently
  // two-finger and stays enabled.)
  const [dragPanEnabled, setDragPanEnabled] = useState(false);

  // `Gesture.Manual` only observes touches — it never activates, so it won't steal
  // the gesture from MapLibre's own pan recognizer; it just counts active pointers.
  const pointerCounter = useMemo(
    () =>
      Gesture.Manual()
        .onTouchesDown((event) => {
          if (event.numberOfTouches >= 2) {
            runOnJS(setDragPanEnabled)(true);
          }
        })
        .onTouchesUp((event) => {
          if (event.numberOfTouches < 2) {
            runOnJS(setDragPanEnabled)(false);
          }
        })
        .onTouchesCancelled(() => {
          runOnJS(setDragPanEnabled)(false);
        }),
    []
  );

  // When the caller disables cooperative gestures (the full-screen Map tab), pan
  // with a single finger directly; otherwise use the two-finger gate.
  const dragPan = useCooperativeGestures === false ? true : dragPanEnabled;

  const mapStyle = useMemo(() => {
    if (useLocalMapStyle) {
      return floodzillaLocalStyle as never;
    }
    if (!region) {
      return "";
    }
    let url = mapStyleBaseUrl;
    if (!url.endsWith("/")) {
      url += "/";
    }
    return url + region.id + "/mobilestyles";
  }, [region]);

  const markers = useMemo(() => {
    if (!gages) {
      return null;
    }
    return gages.map((g, index) => (
      <Marker
        lngLat={[g.longitude!, g.latitude!]}
        anchor="bottom"
        key={"marker" + index}
        onPress={() => {
          onGagePress(g);
        }}>
        <TrendIcon gage={g} iconType={TREND_ICON_TYPES.Map} />
      </Marker>
    ));
  }, [mapRef, gages]);

  const townLabelsGeoJson = useMemo(() => getTownLabelsGeoJson(region?.id), [region]);
  const riverOverlaysGeoJson = useMemo(() => getRiverOverlaysGeoJson(region?.id), [region]);

  const regionBounds: [number, number, number, number] = useMemo(() => {
    if (region && region.regionBounds) {
      return [
        region.regionBounds[0],
        region.regionBounds[1],
        region.regionBounds[2],
        region.regionBounds[3],
      ];
    }
    return defaultRegionBounds as [number, number, number, number];
  }, [region]);

  const startBounds: [number, number, number, number] = useMemo(() => {
    if (singleGage) {
      return [
        singleGage.longitude! - singleGageLngDelta,
        singleGage.latitude! - singleGageLatDelta,
        singleGage.longitude! + singleGageLngDelta,
        singleGage.latitude! + singleGageLatDelta,
      ];
    }
    if (region && region.defaultMobileMapBounds) {
      return [
        region.defaultMobileMapBounds[0],
        region.defaultMobileMapBounds[1],
        region.defaultMobileMapBounds[2],
        region.defaultMobileMapBounds[3],
      ];
    }
    return defaultMapBounds as [number, number, number, number];
  }, [region, singleGage]);

  return (
    <GestureDetector gesture={pointerCounter}>
      <Map
        ref={mapRef}
        style={styles.map}
        mapStyle={mapStyle}
        touchRotate={false}
        dragPan={dragPan}
        onDidFinishRenderingFrameFully={() => {
          if (awaitingInundationRender.current) {
            awaitingInundationRender.current = false;
            onInundationLoad?.();
          }
        }}>
        <Camera maxBounds={regionBounds} bounds={startBounds} />
        {inundationUrl ? (
          <GeoJSONSource id="inundation" data={inundationUrl}>
            <Layer {...INUNDATION_FILL_LAYER_PROPS} />
          </GeoJSONSource>
        ) : null}
        {roadClosuresUrl ? (
          <GeoJSONSource id="road-closures" data={roadClosuresUrl}>
            <Layer {...ROAD_CLOSURE_LINE_LAYER_PROPS} />
            <Layer {...ROAD_CLOSURE_LABEL_LAYER_PROPS} />
          </GeoJSONSource>
        ) : null}
        <GeoJSONSource id="region-rivers" data={riverOverlaysGeoJson}>
          <Layer {...RIVER_OVERLAY_LAYER_PROPS} />
        </GeoJSONSource>
        <GeoJSONSource id="region-towns" data={townLabelsGeoJson}>
          <Layer {...TOWN_LABELS_LAYER_PROPS} />
        </GeoJSONSource>
        {/* Hide gauge icons while a flood level is selected so users aren't
            confused about whether the icons reflect live status or the
            selected visualization level. */}
        {inundationUrl ? null : markers}
      </Map>
    </GestureDetector>
  );
};

const $mobileMapStyle: ViewStyle = {};

export default MapLibreMobileGageMap;
