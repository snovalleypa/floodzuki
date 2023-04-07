import { Colors } from "@common-ui/constants/colors";
import * as React from "react";
import Svg, { G, Path } from "react-native-svg";

const RisingIcon = (props) => (
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
        d="M21.633 7.141l1.917 1.932-6.5 6.549-4.38-4.415a1.318 1.318 0 0 0-1.877 0l-7.986 8.065a1.344 1.344 0 0 0 0 1.892 1.318 1.318 0 0 0 1.877 0l7.043-7.113 4.38 4.415a1.318 1.318 0 0 0 1.877 0l7.442-7.488 1.917 1.932a.664.664 0 0 0 1.132-.47V6.671A.643.643 0 0 0 27.823 6h-5.711a.672.672 0 0 0-.479 1.141z" />
    </G>
  </Svg>
);

export default RisingIcon;
