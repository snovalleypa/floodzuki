module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
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
