const {
  createRunOncePlugin,
  withAndroidStyles,
} = require("expo/config-plugins");

// Force the parent of the theme to be Theme.AppCompat.Light.NoActionBar instead of
// Theme.AppCompat.DayNight.NoActionBar
const withForceLightModeThemeAndroid = (config) => {
  return withAndroidStyles(config, (config) => {
    config.modResults.resources.style.forEach((s) => {
      if (s.$.name === "AppTheme" && s.$.parent === "Theme.AppCompat.DayNight.NoActionBar") {
        s.$.parent = "Theme.AppCompat.Light.NoActionBar";
      }
    });
    return config;
  });
};

module.exports = createRunOncePlugin(
  withForceLightModeThemeAndroid,
  "force-light-mode-android",
  "1.0.0"
);
