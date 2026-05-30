const { defineConfig } = require("eslint/config");
const expo = require("eslint-config-expo/flat");
const eslintConfigPrettier = require("eslint-config-prettier");

module.exports = defineConfig([
  expo,
  eslintConfigPrettier,
  {
    files: ["app/**/*.{ts,tsx}", "src/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-restricted-types": [
        "error",
        {
          types: {
            unknown: "Use a more specific type than unknown.",
          },
        },
      ],
    },
  },
  {
    rules: {
      // Warn instead of error on missing hook deps — codebase predates this rule
      "react-hooks/exhaustive-deps": "warn",
      // Warn instead of error on unescaped entities — legacy legal text files
      "react/no-unescaped-entities": "warn",
      curly: "error",
    },
  },
  {
    ignores: ["node_modules/", "dist/", ".expo/", "ios/", "android/", "patches/"],
  },
]);
