import React, { useEffect, useRef, useState } from "react"
import { Platform, ViewStyle } from "react-native";
import Constants from 'expo-constants';

const Map = Platform.select({
  ios: () => require("../services/maps/MapReactNative").default,
  android: () => require("../services/maps/MapReactNative").default,
  default: () => require("google-map-react").default,
})()

const MapMarker = Platform.select({
  ios: () => require("../services/maps/MapMarkerReactNative").default,
  android: () => require("../services/maps/MapMarkerReactNative").default,
  default: () => require("../services/maps/MapMarkerReact").default,
})()

import { Gage } from "@models/Gage"
import { observer } from "mobx-react-lite"
import { isWeb } from "@common-ui/utils/responsive"
import { Ternary } from "@common-ui/components/Conditional"
import { MobileMapIcon, getMapIcon } from "./TrendIcon"
import { useFocusEffect, useRouter } from "expo-router"
import { ROUTES } from "app/_layout"
import { Spacing } from "@common-ui/constants/spacing";

type GageMapProps = {
  gages: Gage[]
}

const getMapOptions = maps => {
  return {
    streetViewControl: false,
    scaleControl: true,
    disableDoubleClickZoom: true,
    maxZoom: 18,
    mapTypeControl: true,
    mapTypeId: maps.MapTypeId.HYBRID,
    mapTypeControlOptions: {
      style: maps.MapTypeControlStyle.HORIZONTAL_BAR,
      position: maps.ControlPosition.BOTTOM_CENTER,
      mapTypeIds: [maps.MapTypeId.ROADMAP, maps.MapTypeId.HYBRID],
    },
    zoomControl: true,
    clickableIcons: false,
    gestureHandling: "auto",
  };
}

const clearMarkers = mapMarkers => {
  let marker = mapMarkers.pop();
  while (marker) {
    marker.setMap(null);
    marker = mapMarkers.pop();
  }
};

const WebMap = ({ gages }: GageMapProps) => {
  const mapMarkers = useRef([]);
  const [mapBounds, setMapBounds] = useState();
  const [google, setGoogle] = useState<any>(null)
  const router = useRouter();

  const gageSelected = gages.length === 1 ? gages[0] : null;

  useEffect(() => {
    if (google && !gages.length) {
      clearMarkers(mapMarkers.current);
      return;
    }
    
    if (google && gages.length) {
      // remove filtered out markers
      const gageIds = gages.map(g => g.locationId);
      
      for (var i = 0; i < mapMarkers.current.length; i++) {
        if (!gageIds.includes(mapMarkers.current[i].id)) {
          mapMarkers.current[i].setMap(null);
          mapMarkers.current.splice(i, 1);
          i--;
        }
      }
      
      const bounds = new google.maps.LatLngBounds();
      
      for (const gage of gages) {
        if (gage.latitude && gage.longitude) {
          let marker =
            mapMarkers.current &&
            mapMarkers.current.find(m => m.id === gage.locationId);

          marker = createOrUpdateGageMarker(gage, marker);

          marker.setMap(google.map);
          mapMarkers.current.push(marker);
          bounds.extend(marker.getPosition());

          google.maps.event.addListener(marker, "click", function() {
            router.push({ pathname: ROUTES.GageDetails, params: { id: gage?.locationId }})
          });
        }
      }

      setMapBounds(bounds);
    }
  }, [google, gages]);

  useEffect(() => {
    if (
      google &&
      gageSelected &&
      gageSelected.latitude &&
      gageSelected.longitude
    ) {
      google.map.panTo({
        lat: gageSelected.latitude,
        lng: gageSelected.longitude,
      });
      google.map.setZoom(16);
    }

    if (google && !gageSelected && mapBounds) {
      google.map.fitBounds(mapBounds);
      google.maps.event.trigger(google.map, "resize");
    }
  }, [gageSelected, google, mapBounds]);

  const createOrUpdateGageMarker = (gage, marker) => {
    let gageStatus = gage.gageStatus
    
    const icon = {
      url:
        "data:image/svg+xml;charset=UTF-8;base64," +
        btoa(
          getMapIcon(gageStatus.levelTrend)
        ),
      scaledSize: new google.maps.Size(54, 60), // scaled size
      origin: new google.maps.Point(0, 0), // origin
      anchor: new google.maps.Point(27, 50), // anchor
    };
    
    if (marker) {
      marker.setIcon(icon);
      return marker;
    }
    
    return new google.maps.Marker({
      position: { lat: gage.latitude, lng: gage.longitude },
      title: gage.locationName,
      id: gage.locationId,
      gage: gage,
      icon: icon,
    });
  };

  return (
    <Map
      zoom={4}
      center={{ lat: 47.622403, lng: -121.933723 }}
      options={getMapOptions}
      yesIWantToUseGoogleMapApiInternals
      onGoogleApiLoaded={({ map, maps }) => {
        setGoogle({ map, maps });
      }}
    />
  )
}

const MobileMap = ({ gages }: GageMapProps) => {
  const router = useRouter();
  const mapRef = useRef(null)

  const markerIds = gages.map(g => g.locationId)

  const [region] = useState({
    latitude: 47.622403,
    longitude: -121.933723,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  })

  const fitToMarkers = () => {
    mapRef.current?.fitToSuppliedMarkers(markerIds, {
      edgePadding: {
        top: Spacing.large,
        right: Spacing.large,
        bottom: Spacing.large,
        left: Spacing.large
      },
      animated: true,
    })
  }

  useEffect(() => {
    fitToMarkers()
  }, [markerIds, mapRef.current])

  useFocusEffect(() => {
    fitToMarkers()
  })

  const onMarkerPress = (e) => {
    const { id } = e.nativeEvent

    if (!id) return

    router.push({ pathname: ROUTES.GageDetails, params: { id }})
  }

  return (
    <Map
      ref={mapRef}
      style={$mobileMapStyle}
      initialRegion={region}
      minZoomLevel={4}
      maxZoomLevel={18}
      provider="google"
      mapType="hybrid"
      onMarkerPress={onMarkerPress}
      mapPadding={{ top: Spacing.extraSmall, right: Spacing.extraSmall, bottom: Spacing.extraSmall, left: Spacing.extraSmall }}
    >
      {gages.map(gage => {
        if (gage?.latitude && gage?.longitude) {
          return (
            <MapMarker
              key={gage.locationId}
              identifier={gage.locationId}
              coordinate={{
                latitude: gage.latitude,
                longitude: gage.longitude,
              }}
              title={gage.locationName}
            >
              <MobileMapIcon levelTrend={gage?.status?.levelTrend} />
            </MapMarker>
          )
        }

        return null
      })}
    </Map>
  )
}

const $mobileMapStyle: ViewStyle = {
  width: "100%",
  height: "100%",
  borderRadius: Spacing.tiny
}

const GageMap = observer(
  function GageMap(props: GageMapProps) {
    const { gages } = props

    if (!gages) return null

    return (
      <>
        <Ternary condition={isWeb}>
          <WebMap gages={gages} />
          <MobileMap gages={gages} />
        </Ternary>
      </>
    )
  }
)

export default GageMap
