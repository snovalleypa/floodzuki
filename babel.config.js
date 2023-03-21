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
            "@components": "./app/components",
            "@common-ui": "./app/common-ui",
            "@config": "./app/config",
            "@i18n": "./app/i18n",
            "@models": "./app/models",
            "@navigators": "./app/navigators",
            "@screens": "./app/screens",
            "@services": "./app/services",
            "@theme": "./app/theme",
            "@utils": "./app/utils",
          },
        },
      ],
      "react-native-reanimated/plugin",
      require.resolve("expo-router/babel"),
    ],
  };
};
