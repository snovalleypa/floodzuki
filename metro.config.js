// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.transformer = {
  ...config.transformer,
  // Use the Expo transformer.
  babelTransformerPath: require.resolve("@expo/metro-runtime/transformer"),
};

// Ensure CSS is treated as a source file.
config.resolver.sourceExts.push("css");
config.resolver.sourceExts.push("html");

module.exports = config;
