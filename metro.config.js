// Learn more https://docs.expo.io/guides/customizing-metro
/** @type {import('@expo/metro-config').MetroConfig} */
const { getDefaultConfig } = require("@expo/metro-config");
const config = getDefaultConfig(__dirname, {
  isCSSEnabled: true,
});

config.watcher.additionalExts.push("mjs", "cjs");

// Prevent the bundler from trying to automatically load any mobile-only controls; otherwise,
// hot reload on the web version will throw errors.
const nativeOnlyModules = ["./MapLibreMobileGageMap"];

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === "web" && nativeOnlyModules.includes(moduleName)) {
    return {
      type: "empty",
    };
  }
  // Default behavior for other module resolutionsF
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
