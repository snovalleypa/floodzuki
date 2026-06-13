import { Map, Marker, Source, Layer, useMap } from "@vis.gl/react-maplibre";
import { useMemo } from "react";
import { InternalGageMapProps } from "@models/MapModels";
import { StyleSheet } from "react-native";
import "maplibre-gl/dist/maplibre-gl.css";
import TrendIcon, { TREND_ICON_TYPES } from "./TrendIcon";
import { getTownLabelsGeoJson, TOWN_LABELS_LAYER_PROPS } from "./townLabels";
import { getRiverOverlaysGeoJson, RIVER_OVERLAY_LAYER_PROPS } from "./riverOverlays";
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

const singleGageLatDelta = 0.00922;
const singleGageLngDelta = 0.00421;

const MapLibreWebGageWebMap = ({
  gages,
  region,
  onGagePress,
  singleGage,
}: InternalGageMapProps) => {
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
      initialViewState={{
        bounds: startBounds,
      }}
      maxBounds={regionBounds}
      mapStyle={mapStyle}
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
      style={styles.map}>
      <Source id="region-rivers" type="geojson" data={riverOverlaysGeoJson}>
        <Layer {...RIVER_OVERLAY_LAYER_PROPS} />
      </Source>
      <Source id="region-towns" type="geojson" data={townLabelsGeoJson}>
        <Layer {...TOWN_LABELS_LAYER_PROPS} />
      </Source>
      {markers}
    </Map>
  );
};

export default MapLibreWebGageWebMap;
