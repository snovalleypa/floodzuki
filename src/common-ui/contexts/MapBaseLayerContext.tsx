import React from "react";
import { MapBaseLayer } from "@models/MapModels";

type MapBaseLayerContextType = {
  baseLayer: MapBaseLayer;
  setBaseLayer: (layer: MapBaseLayer) => void;
};

// Session-scoped: mounted in the tab layout so the choice survives tab switches
// but resets on a full app restart (no persistence by design).
const MapBaseLayerContext = React.createContext<MapBaseLayerContextType>({
  baseLayer: MapBaseLayer.Map,
  setBaseLayer: () => {},
});

export const useMapBaseLayer = () => React.useContext(MapBaseLayerContext);

export const MapBaseLayerProvider = ({ children }: { children: React.ReactNode }) => {
  const [baseLayer, setBaseLayer] = React.useState<MapBaseLayer>(MapBaseLayer.Map);
  return (
    <MapBaseLayerContext.Provider value={{ baseLayer, setBaseLayer }}>
      {children}
    </MapBaseLayerContext.Provider>
  );
};
