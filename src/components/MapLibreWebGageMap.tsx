import { Map, Marker, Source, Layer, useMap, type MapRef } from "@vis.gl/react-maplibre";
import { useEffect, useMemo, useRef } from "react";
import {
  InternalGageMapProps,
  SINGLE_GAGE_LAT_DELTA,
  SINGLE_GAGE_LNG_DELTA,
} from "@models/MapModels";
import { useResponsive } from "@common-ui/utils/responsive";
import { useLocale } from "@common-ui/contexts/LocaleContext";
import { StyleSheet } from "react-native";
import "maplibre-gl/dist/maplibre-gl.css";
import TrendIcon, { TREND_ICON_TYPES } from "./TrendIcon";
import { getTownLabelsGeoJson, TOWN_LABELS_LAYER_PROPS } from "./townLabels";
import { getRiverOverlaysGeoJson, RIVER_OVERLAY_LAYER_PROPS } from "./riverOverlays";
import { INUNDATION_FILL_LAYER_PROPS } from "./inundationOverlay";
import { ROAD_CLOSURE_LINE_LAYER_PROPS, ROAD_CLOSURE_LABEL_LAYER_PROPS } from "./roadClosures";
import Config from "../config/config";
import Constants from "expo-constants";
import floodzillaLocalStyle from "./mapStyles/floodzilla-webstyles.json";

const mapStyleBaseUrl =
  Constants.expoConfig.extra.mapTileUrlBase || Config.DEFAULT_MAP_TILE_BASE_URL;

const useLocalMapStyle = Boolean(Constants.expoConfig.extra.mapStyleLocal);

const styles = StyleSheet.create({
  map: {
    width: "100%",
    height: "100%",
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

const MapLibreWebGageWebMap = ({
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
  // The typed map error event doesn't carry a sourceId, so we scope errors to the
  // inundation load by only treating an error as an inundation failure while we're
  // awaiting one. Armed when a new URL is set; disarmed once the source loads
  // successfully or an error has been reported.
  const awaitingInundation = useRef(false);
  useEffect(() => {
    awaitingInundation.current = Boolean(inundationUrl);
  }, [inundationUrl]);

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
    return url + region.id + "/webstyles";
  }, [region]);

  const { current: map } = useMap();

  // On the narrow (mobile-web) layout the map is the header of a vertically-scrolling
  // list, so a one-finger drag should scroll the page rather than pan the map.
  // maplibre's `cooperativeGestures` gives exactly that: one finger scrolls the page
  // (with a hint overlay), two fingers pan/zoom. On desktop we leave it off so the
  // free pan/scroll-zoom behavior is unchanged.
  const { isMobile } = useResponsive();
  const coop = useCooperativeGestures ?? isMobile;
  const { t } = useLocale();
  const mapRef = useRef<MapRef>(null);

  // Localized overrides for maplibre's built-in cooperative-gestures hint overlay.
  // maplibre merges this with its default locale, so we only override these keys.
  const mapLocale = useMemo(
    () => ({
      "CooperativeGesturesHandler.WindowsHelpText": t("map.cooperativeGesturesWindows"),
      "CooperativeGesturesHandler.MacHelpText": t("map.cooperativeGesturesMac"),
      "CooperativeGesturesHandler.MobileHelpText": t("map.cooperativeGesturesMobile"),
    }),
    [t]
  );

  // `cooperativeGestures` is only read at map init by @vis.gl/react-maplibre (it is
  // not one of its reactive handler props), so toggle it directly when the viewport
  // crosses the breakpoint, e.g. on resize or device rotation.
  useEffect(() => {
    const gl = mapRef.current?.getMap();
    if (!gl) {
      return;
    }
    if (coop) {
      gl.cooperativeGestures.enable();
    } else {
      gl.cooperativeGestures.disable();
    }
  }, [coop]);

  const townLabelsGeoJson = useMemo(() => getTownLabelsGeoJson(region?.id), [region]);
  const riverOverlaysGeoJson = useMemo(() => getRiverOverlaysGeoJson(region?.id), [region]);

  const markers = useMemo(() => {
    return gages.map(
      (g, index) =>
        g.latitude &&
        g.longitude && (
          <Marker
            style={styles.marker}
            longitude={g.longitude}
            latitude={g.latitude}
            anchor="bottom"
            onClick={() => {
              onGagePress(g);
            }}
            key={"marker" + index}>
            <TrendIcon gage={g} iconType={TREND_ICON_TYPES.Map} />
          </Marker>
        )
    );
  }, [map, gages]);

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
    if (singleGage && singleGage.longitude && singleGage.latitude) {
      return [
        singleGage.longitude - singleGageLngDelta,
        singleGage.latitude - singleGageLatDelta,
        singleGage.longitude + singleGageLngDelta,
        singleGage.latitude + singleGageLatDelta,
      ];
    }
    if (region && region.defaultWebMapBounds) {
      return [
        region.defaultWebMapBounds[0],
        region.defaultWebMapBounds[1],
        region.defaultWebMapBounds[2],
        region.defaultWebMapBounds[3],
      ];
    }
    return defaultMapBounds as [number, number, number, number];
  }, [region, singleGage]);

  // Until the region (and thus a real map style) is available, don't mount the
  // map. react-maplibre normalizes an empty mapStyle to null, which leaves the
  // underlying maplibre map without a `style` object and then crashes in its
  // _updateStyleComponents (`map.style._loaded`). This happens on a fresh load
  // (e.g. incognito) before region data is fetched.
  if (!mapStyle) {
    return null;
  }

  return (
    <Map
      ref={mapRef}
      initialViewState={{
        bounds: startBounds,
      }}
      maxBounds={regionBounds}
      mapStyle={mapStyle}
      cooperativeGestures={coop}
      locale={mapLocale}
      attributionControl={{ compact: true }}
      onLoad={(e) => {
        const container = e.target.getContainer();
        setTimeout(() => {
          const expanded = container.querySelector(
            ".maplibregl-ctrl-attrib.maplibregl-compact-show"
          );
          if (expanded) {
            const button = container.querySelector(
              ".maplibregl-ctrl-attrib-button"
            ) as HTMLButtonElement | null;
            button?.click();
          }
        }, 1000);
      }}
      onSourceData={(e) => {
        if (e.sourceId === "inundation" && e.isSourceLoaded) {
          awaitingInundation.current = false;
          onInundationLoad?.();
        }
      }}
      onError={(e) => {
        // No sourceId on the typed error event; treat any error while awaiting the
        // inundation source as that load failing (the basemap is already loaded by
        // the time a level is selected).
        if (awaitingInundation.current) {
          awaitingInundation.current = false;
          onInundationError?.();
        }
      }}
      style={styles.map}>
      {inundationUrl ? (
        <Source id="inundation" type="geojson" data={inundationUrl}>
          <Layer {...INUNDATION_FILL_LAYER_PROPS} />
        </Source>
      ) : null}
      {roadClosuresUrl ? (
        <Source id="road-closures" type="geojson" data={roadClosuresUrl}>
          <Layer {...ROAD_CLOSURE_LINE_LAYER_PROPS} />
          <Layer {...ROAD_CLOSURE_LABEL_LAYER_PROPS} />
        </Source>
      ) : null}
      <Source id="region-rivers" type="geojson" data={riverOverlaysGeoJson}>
        <Layer {...RIVER_OVERLAY_LAYER_PROPS} />
      </Source>
      <Source id="region-towns" type="geojson" data={townLabelsGeoJson}>
        <Layer {...TOWN_LABELS_LAYER_PROPS} />
      </Source>
      {/* Hide gauge icons while a flood level is selected so users aren't
          confused about whether the icons reflect live status or the
          selected visualization level. */}
      {inundationUrl ? null : markers}
    </Map>
  );
};

export default MapLibreWebGageWebMap;
