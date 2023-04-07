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
        d="M21.661 20.731l1.92-1.92-6.507-6.511-4.387 4.387a1.328 1.328 0 0 1-1.88 0l-8-8.013A1.329 1.329 0 0 1 4.688 6.8l7.053 7.067 4.387-4.387a1.328 1.328 0 0 1 1.88 0l7.453 7.44 1.92-1.92a.666.666 0 0 1 1.133.467v5.72a.66.66 0 0 1-.667.667h-5.72a.655.655 0 0 1-.467-1.12z" />
    </g>
  </svg>
);

export default SVGComponent;