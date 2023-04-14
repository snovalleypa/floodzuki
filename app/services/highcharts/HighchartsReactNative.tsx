// Copied from https://github.com/highcharts/highcharts-react-native/blob/master/dist/src/HighchartsReactNative.js

import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    ViewStyle,
} from 'react-native';
import { WebView, WebViewMessageEvent, WebViewProps } from 'react-native-webview';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';

const stringifiedScripts = {};

let cdnPath = 'code.highcharts.com/';
let httpProto = 'http://';

interface HighchartsReactNativeProps {
  data?: any; // Data to be stored as global variable in Webview.
  options: Highcharts.Options; // Highcharts options.
  modules?: string[]; // List of modules to be loaded.
  setOptions?: Record<string, unknown>; // Highcharts setOptions.
  styles?: ViewStyle; // Styles to be applied to the container.
  webviewProps?: WebViewProps; // Props to be passed to the WebView.
  onMessage?: (data: string) => void; // Callback for WebView messages.
  startInLoadingState?: boolean; // Whether to show loading indicator on WebView.
  webviewStyles?: ViewStyle; // Styles to be applied to the WebView.
}

type ScriptsProps = Pick<HighchartsReactNativeProps, 'data' | 'modules' | 'options' | 'setOptions'>

const serialize = (chartOptions: Highcharts.Options, isUpdate?: boolean) => {
  let hcFunctions = {},
  serializedOptions,
  i = 0;

  serializedOptions = JSON.stringify(chartOptions, function (_val, key) {
    const fcId = '###HighchartsFunction' + i + '###';

    // set reference to function for the later replacement
    if (typeof key === 'function') {
      hcFunctions[fcId] = key.toString();
      i++;
      return isUpdate ? key.toString() : fcId;
    }

    return key;
  });

  // replace ids with functions.
  if (!isUpdate) {
    Object.keys(hcFunctions).forEach(function (key) {
      serializedOptions = serializedOptions.replace(
        '"' + key + '"',
        hcFunctions[key]
      );
    });
  }

  return serializedOptions;
}

const buildScripts = (props: ScriptsProps) => {
  const { data, modules, options, setOptions } = props;

  return (
    `(function() {
        window.data = \"${data ? data : null}\";
        var modulesList = ${JSON.stringify(modules)};
        var readable = ${JSON.stringify(stringifiedScripts)}

        function loadScripts(file, callback, redraw) {
          var hcScript = document.createElement('script');
          hcScript.innerHTML = readable[file]
          document.body.appendChild(hcScript);

          if (callback) {
            callback.call();
          }

          if (redraw) {
            Highcharts.setOptions(${serialize(setOptions)});
            Highcharts.chart("container", ${serialize(options)});
          }
        }

        loadScripts('highcharts', function () {
          var redraw = modulesList.length > 0 ? false : true;
          loadScripts('highcharts-more', function () {
              if (modulesList.length > 0) {
                  for (var i = 0; i < modulesList.length; i++) {
                      if (i === (modulesList.length - 1)) {
                          redraw = true;
                      } else {
                          redraw = false;
                      }
                      loadScripts(modulesList[i], undefined, redraw, true);
                  }
              }
          }, redraw);
        }, false);

        return true;
      })();
    `
  )
}

const getAssetAsString = async (asset: Asset) => {
  const downloadedModules = await FileSystem.readDirectoryAsync(FileSystem.cacheDirectory)
  let fileName = 'ExponentAsset-' + asset.hash + '.' + asset.type

  if (!downloadedModules.includes(fileName)) {
      await asset.downloadAsync()
  }

  return await FileSystem.readAsStringAsync(FileSystem.cacheDirectory + fileName)
}

const addScript = async (name: string, isModule: boolean) => {
  const moduleUrl = httpProto + cdnPath + (isModule ? 'modules/' : '') + name + '.js'

  const response = await fetch(moduleUrl).catch((error) => {
    throw error
  })
  stringifiedScripts[name] = await response.text()
}

const HighchartsReactNative = React.memo((props: HighchartsReactNativeProps) => {
  const {
    styles,
    onMessage,
    data,
    startInLoadingState = true,
    webviewStyles,
    webviewProps = {},
    modules = [],
    options,
    setOptions = {},
  } = props;

  const webviewRef = useRef<WebView>(null)

  const [modulesReady, setModulesReady] = useState(false)
  const [layoutHTML, setLayoutHTML] = useState('')

  const handleMessage = (event: WebViewMessageEvent) => {
    onMessage && onMessage(event.nativeEvent.data)
  }

  useEffect(() => {
    if (!modulesReady) {
      return
    }
    
    webviewRef.current?.postMessage(serialize(options, true))
  }, [options, modulesReady])

  useEffect(() => {
    const getModules = async () => {
      const indexHTML = await getAssetAsString(Asset.fromModule(require('./highcharts-layout.html')))

      await addScript('highcharts', false)

      if (modules.length > 0) {
        await addScript('highcharts-more', false)

        for (let i = 0; i < modules.length; i++) {
          await addScript(modules[i], true)
        }
      }

      setModulesReady(true)
      setLayoutHTML(indexHTML)
    }

    getModules()
  }, [])

  // Do not render anything until modules are ready.
  if (!modulesReady) {
      return null
  }

  const runFirst = buildScripts({ data, modules, options, setOptions })

  return (
    <View style={styles}>
      <WebView
        ref={webviewRef}
        onMessage={handleMessage}
        source={{ html: layoutHTML }}
        injectedJavaScript={runFirst}
        originWhitelist={["*"]}
        automaticallyAdjustContentInsets={true}
        allowFileAccess={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scrollEnabled={false}
        mixedContentMode='always'
        allowFileAccessFromFileURLs={true}
        startInLoadingState={startInLoadingState}
        style={webviewStyles}
        androidHardwareAccelerationDisabled
        {...webviewProps}
      />
    </View>
  )
})

export default HighchartsReactNative
