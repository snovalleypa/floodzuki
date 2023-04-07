import { Colors } from "@common-ui/constants/colors";
import * as React from "react";
import Svg, { G, Path } from "react-native-svg";

const FlatIcon = (props) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={props.size ?? 24}
    height={props.size ?? 24}
    viewBox="0 0 30 24"
    {...props}
  >
    <G>
      <Path
        fill={props.color ?? Colors.dark}
        d="M27.867 12.631l-3.72-3.72A.668.668 0 0 0 23 9.377v2.387H4.333a1.333 1.333 0 1 0 0 2.667H23v2.387a.66.66 0 0 0 1.133.467l3.72-3.72a.656.656 0 0 0 .013-.933z" />
    </G>
  </Svg>
);

export default FlatIcon;
