
import React from "react";
import { View } from "react-native";
import { isMobile } from "@common-ui/utils/responsive";

// A universal Link component that works for web and mobile
// For web - it'll render an <a> tag with target="_blank"
// For mobile - it'll render a <View> component instead

interface FLinkProps {
  href: string;
  children: React.ReactNode;

}

export const FLink = (props: FLinkProps) => {
  if (isMobile) {
    return <View {...props} />;
  }

  return <a target="_blank" {...props} />;
};
