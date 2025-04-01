// Learn more https://docs.expo.io/guides/customizing-metro
/** @type {import('@expo/metro-config').MetroConfig} */
const { getDefaultConfig } = require("@expo/metro-config");
const config = getDefaultConfig(__dirname, {
  isCSSEnabled: true,
});

config.watcher.additionalExts.push('mjs', 'cjs');

module.exports = config;
