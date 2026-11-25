import js from "@eslint/js";
import firebaseRulesPlugin from "@firebase/eslint-plugin-security-rules";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: [
      "dist/**/*",
      "docs-llm/**/*",
      "node_modules/**/*",
      "src/app/**",
      "src/config/**",
      "src/content/**",
      "src/domain/**",
      "src/features/**",
      "src/i18n/**",
      "src/labs/**",
      "src/lib/**",
    ],
  },
  ...tseslint.config({
    files: ["src/main.tsx", "src/App.tsx", "src/studio/**/*.{ts,tsx}", "vite.config.ts"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    plugins: {
      "react-hooks": reactHooks,
    },
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  }),
  firebaseRulesPlugin.configs["flat/recommended"],
];

