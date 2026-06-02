// Adapted from https://github.com/highcharts/highcharts-react-native

import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, ViewStyle } from "react-native";
import { WebView, WebViewMessageEvent, WebViewProps } from "react-native-webview";
import { buildLayoutHtml } from "./HighchartsLayout";

interface HighchartsReactNativeProps {
  options: Highcharts.Options;
  modules?: string[];
  styles?: ViewStyle;
  webviewProps?: WebViewProps;
  onMessage?: (data: string) => void;
  startInLoadingState?: boolean;
  webviewStyles?: ViewStyle;
  setOptions?: Record<string, unknown>;
}

// Serialize options as a JS literal for inline interpolation into the WebView
// init script. Functions are emitted as raw source via
// `Function.prototype.toString()`. WARNING: on Hermes (RN new arch default),
// `toString()` returns `function () { [bytecode] }` instead of real source —
// the function will throw `ReferenceError: Can't find variable: bytecode`
// when called inside the WebView. Callers that need per-point computed
// values should precompute them as plain-data fields on each point (e.g.
// `tooltipHtml`) and rely on a static formatter installed inside
// HighchartsLayout.tsx.
const serializeForInit = (chartOptions: Highcharts.Options | Record<string, unknown>): string => {
  const hcFunctions: Record<string, string> = {};
  let i = 0;

  let serialized = JSON.stringify(chartOptions, function (_key, value) {
    if (typeof value === "function") {
      const fcId = "###HCF" + i + "###";
      hcFunctions[fcId] = value.toString();
      i++;
      return fcId;
    }
    return value;
  });

  Object.keys(hcFunctions).forEach((key) => {
    serialized = serialized.replace('"' + key + '"', hcFunctions[key]);
  });

  return serialized;
};

// Serialize options as plain JSON for the postMessage update path. Functions
// are dropped — the WebView side runs JSON.parse, which can't restore them.
const serializeForUpdate = (chartOptions: Highcharts.Options): string =>
  JSON.stringify(chartOptions, (_key, value) => (typeof value === "function" ? undefined : value));

const HighchartsReactNative = React.memo((props: HighchartsReactNativeProps) => {
  const {
    styles,
    onMessage,
    startInLoadingState = true,
    webviewStyles,
    webviewProps = {},
    modules = [],
    options,
    setOptions = {},
  } = props;

  const webviewRef = useRef<WebView>(null);
  const [chartReady, setChartReady] = useState(false);

  // Build HTML once per modules list — changes to modules force a WebView reload.
  const html = useMemo(() => buildLayoutHtml(modules), [modules.join(",")]);

  // Send updated options to the already-rendered chart via postMessage.
  useEffect(() => {
    if (!chartReady) {
      return;
    }
    webviewRef.current?.postMessage(serializeForUpdate(options));
  }, [options, chartReady]);

  const handleMessage = (event: WebViewMessageEvent) => {
    const { data } = event.nativeEvent;
    if (data === "chart-ready") {
      setChartReady(true);
      return;
    }
    onMessage?.(data);
  };

  // Highcharts is loaded by the HTML via <script src>. This script only
  // initializes the chart — it is small enough to inject safely.
  const initScript = `
    (function() {
      try {
        Highcharts.setOptions(${serializeForInit(setOptions)});
        Highcharts.chart('container', ${serializeForInit(options)});
        window.ReactNativeWebView.postMessage('chart-ready');
      } catch (e) {
        window.ReactNativeWebView.postMessage('error:' + e.message);
      }
      return true;
    })();
  `;

  return (
    <View style={styles}>
      <WebView
        ref={webviewRef}
        onMessage={handleMessage}
        source={{ html, baseUrl: "https://code.highcharts.com/" }}
        injectedJavaScript={initScript}
        originWhitelist={["*"]}
        automaticallyAdjustContentInsets={true}
        allowFileAccess={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scrollEnabled={false}
        mixedContentMode="always"
        allowFileAccessFromFileURLs={true}
        startInLoadingState={startInLoadingState}
        style={webviewStyles}
        webviewDebuggingEnabled={__DEV__}
        {...({ androidHardwareAccelerationDisabled: true } as any)}
        {...webviewProps}
      />
    </View>
  );
});

HighchartsReactNative.displayName = "HighchartsReactNative";

export default HighchartsReactNative;
