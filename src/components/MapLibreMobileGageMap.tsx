import { InternalGageMapProps } from "@models/MapModels";
import { useMemo, useRef } from "react";
import { Camera, GeoJSONSource, Layer, Map, Marker } from "@maplibre/maplibre-react-native";
import { StyleSheet, ViewStyle } from "react-native";
import { Spacing } from "../common-ui/constants/spacing";
import MapPinIcon from "./MapPinIcon";
import { getTownLabelsGeoJson, TOWN_LABELS_LAYER_PROPS } from "./townLabels";
import { getRiverOverlaysGeoJson, RIVER_OVERLAY_LAYER_PROPS } from "./riverOverlays";
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

const singleGageLatDelta = 0.00421;
const singleGageLngDelta = 0.00421;

const MapLibreMobileGageMap = ({
  gages,
  region,
  onGagePress,
  singleGage,
}: InternalGageMapProps) => {
  const mapRef = useRef(null);

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
        <MapPinIcon gage={g} />
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
    <Map ref={mapRef} style={styles.map} mapStyle={mapStyle} touchRotate={false}>
      <Camera maxBounds={regionBounds} bounds={startBounds} />
      <GeoJSONSource id="region-rivers" data={riverOverlaysGeoJson}>
        <Layer {...RIVER_OVERLAY_LAYER_PROPS} />
      </GeoJSONSource>
      <GeoJSONSource id="region-towns" data={townLabelsGeoJson}>
        <Layer {...TOWN_LABELS_LAYER_PROPS} />
      </GeoJSONSource>
      {markers}
    </Map>
  );
};

const $mobileMapStyle: ViewStyle = {};

export default MapLibreMobileGageMap;
