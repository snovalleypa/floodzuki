import React from "react";

import { Gage } from "@models/Gage";
import { useFloodRiskLevel } from "@utils/useFloodRiskLevel";

import FloodRiskBadge from "./FloodRiskBadge";
import TrendIcon, { TREND_ICON_TYPES } from "./TrendIcon";

/**
 * Map-pin content for a gauge: the chance-of-flooding badge when the risk is
 * High/Medium, otherwise the usual trend pin. Lives in its own component so the
 * `useFloodRiskLevel` hook runs per marker (markers are built in a `.map`, where
 * hooks can't be called directly).
 */
const MapPinIcon = ({ gage }: { gage: Gage }) => {
  const riskLevel = useFloodRiskLevel(gage);

  if (riskLevel) {
    return <FloodRiskBadge level={riskLevel} variant="pin" />;
  }
  return <TrendIcon gage={gage} iconType={TREND_ICON_TYPES.Map} />;
};

export default MapPinIcon;
