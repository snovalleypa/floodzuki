// Learn more https://docs.expo.io/guides/customizing-metro
/** @type {import('@expo/metro-config').MetroConfig} */
const { getDefaultConfig } = require("@expo/metro-config");
const config = getDefaultConfig(__dirname, {
  isCSSEnabled: true,
});

config.watcher.additionalExts.push("mjs", "cjs");

// GageMap.tsx picks the map implementation with Platform.select + require(), but
// Metro bundles every require() branch it can see, so without these rules each
// platform would also pull in the other platform's map library.
//
// - Web must not load the native map: hot reload throws on its native modules.
// - Native must not load the web map: it imports maplibre-gl 6, which is ESM-only
//   and uses `import.meta` — a hard Babel error under Hermes (and 1.5 MB of dead
//   code even if it weren't).
const nativeOnlyModules = ["./MapLibreMobileGageMap"];
const webOnlyModules = ["./MapLibreWebGageMap"];

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === "web" && nativeOnlyModules.includes(moduleName)) {
    return {
      type: "empty",
    };
  }
  if (platform !== "web" && webOnlyModules.includes(moduleName)) {
    return {
      type: "empty",
    };
  }
  // Default behavior for other module resolutionsF
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
