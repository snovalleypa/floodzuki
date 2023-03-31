import React from "react";

import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import BrokenAxis from "highcharts/modules/broken-axis";
import { isWeb } from "@common-ui/utils/responsive";

export default function LocalHighchartsReact(props: HighchartsReact.Props) {
  if (isWeb) {
    BrokenAxis(Highcharts);
  }

  return <HighchartsReact
    highcharts={Highcharts}
    {...props}
  />;
}
