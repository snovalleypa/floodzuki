import type { ViewStyle } from "react-native";
import type { WebViewProps } from "react-native-webview";

type HighchartsReactNativeProps = {
  options: Highcharts.Options;
  modules?: string[];
  styles?: ViewStyle;
  webviewProps?: WebViewProps;
  onMessage?: (data: string) => void;
  startInLoadingState?: boolean;
  webviewStyles?: ViewStyle;
  setOptions?: Highcharts.Options;
};

// Exporting empty module for Web

const HighchartsReactNative = (_props: HighchartsReactNativeProps) => {
  return null;
};

export default HighchartsReactNative;
