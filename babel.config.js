module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        "babel-preset-expo",
        {
          // maplibre-gl 6 is ESM-only and references `import.meta.url` (worker
          // discovery). Metro serves lazily-loaded modules as classic scripts, where
          // `import.meta` is a SyntaxError, so the map silently never mounted on web.
          // This rewrites it to Expo's registry object. Web only — native keeps the
          // default (Hermes has no `import.meta`, and the mobile map is a different lib).
          web: { unstable_transformImportMeta: true },
        },
      ],
    ],
    plugins: [
      "@babel/plugin-proposal-export-namespace-from",
      [
        "module-resolver",
        {
          root: ["./"],
          extensions: [".js", ".jsx", ".ts", ".tsx", ".json"],
          alias: {
            "@assets": "./assets",
            "@components": "./src/components",
            "@common-ui": "./src/common-ui",
            "@config": "./src/config",
            "@i18n": "./src/i18n",
            "@models": "./src/models",
            "@navigators": "./src/navigators",
            "@screens": "./src/screens",
            "@services": "./src/services",
            "@theme": "./src/theme",
            "@utils": "./src/utils",
          },
        },
      ],
      "react-native-worklets/plugin",
    ],
  };
};
