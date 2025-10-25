import js from "@eslint/js";
import globals from "globals";
import reactPlugin from "eslint-plugin-react";
import jsxA11y from "eslint-plugin-jsx-a11y";
import jestPlugin from "eslint-plugin-jest";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import testingLibrary from "eslint-plugin-testing-library";
import babelParser from "@babel/eslint-parser";

export default [
  js.configs.recommended,

  // Ignore non-source
  {
    ignores: [
      "node_modules/**",
      "coverage/**",
      "coverage/.tmp/**",
      "**/*.json",
      "**/*.css",
      "**/*.md",
      "package-lock.json",
      "**/*.d.ts",
    ],
  },

  // App source
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      react: reactPlugin,
      "jsx-a11y": jsxA11y,
      jest: jestPlugin,
      "testing-library": testingLibrary,
      "@typescript-eslint": tsPlugin,
    },
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: { presets: ["@babel/preset-react"] },
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    settings: { react: { version: "detect" } },
    rules: {
      "no-console": "warn",
      "no-unused-vars": "off",
      "no-empty": ["error", { "allowEmptyCatch": true }],
      "no-useless-catch": "warn",
      "react/prop-types": "off",
    },
  },

  // Tests and setup: allow unused vars
  {
    files: ["**/*.{test,spec}.{js,jsx,ts,tsx}", "**/__tests__/**", "**/setupTests.{js,jsx,ts,tsx}"],
    plugins: { jest: jestPlugin },
    languageOptions: {
      globals: { ...globals.jest, vi: true, beforeEach: true, afterEach: true, describe: true, it: true, test: true, expect: true },
    },
    rules: {
      "no-unused-vars": "off",
      "no-empty": "off",
      "no-console": "off",
      "jest/no-disabled-tests": "warn",
      "jest/no-focused-tests": "error",
    },
  },

  // Utility scripts: allow console
  {
    files: ["run_all_ui_test.js", "src/logError.js"],
    rules: {
      "no-console": "off",
    },
  },

  // Optional: silence unused vars in App.jsx (remove if you prefer fixing them)
  {
    files: ["src/App.jsx"],
    rules: {
      "no-unused-vars": "off",
      "unused-imports/no-unused-vars": "off",
    },
  },
];