import { Colors } from "@common-ui/constants/colors";
import * as React from "react";

const SVGComponent = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={props.size ?? 24}
    height={props.size ?? 24}
    viewBox="0 0 30 24"
    {...props}
  >
    <g>
      <path
        fill={props.color ?? Colors.dark}
        d="M17.56 14.24a5.987 5.987 0 0 0-7.8-7.8l1.62 1.62A4.2 4.2 0 0 1 12 8a4 4 0 0 1 4 4 4.457 4.457 0 0 1-.05.63zM12 4a8 8 0 0 1 8 8 7.9 7.9 0 0 1-.95 3.74l1.47 1.47A9.861 9.861 0 0 0 22 12 9.993 9.993 0 0 0 6.79 3.47l1.46 1.46A8.039 8.039 0 0 1 12 4zM3.27 2.5L2 3.77l2.1 2.1a9.994 9.994 0 0 0 2.89 14.78l1-1.73A8.005 8.005 0 0 1 4 12a7.9 7.9 0 0 1 1.53-4.69l1.43 1.44A5.987 5.987 0 0 0 9 17.19l1-1.74a3.942 3.942 0 0 1-1.56-5.24l1.58 1.58L10 12a2.006 2.006 0 0 0 2 2l.21-.02.01.01 7.51 7.51L21 20.23 4.27 3.5z" />
    </g>
  </svg>
);

export default SVGComponent;
