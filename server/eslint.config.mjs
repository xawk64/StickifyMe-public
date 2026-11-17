import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["node_modules/", "coverage/", "dist/", "uploads/"] },
  js.configs.recommended,
  {
    files: ["**/*.mjs"],
    languageOptions: { sourceType: "module", globals: { ...globals.node } },
  },
  {
    files: ["**/*.ts", "**/*.mts"],
    extends: [tseslint.configs.strict],
    languageOptions: { globals: { ...globals.node } },
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      eqeqeq: ["error", "always"],
    },
  },
  {
    // application code logs through pino only
    files: ["src/**/*.ts"],
    rules: { "no-console": "error" },
  },
  {
    // documents loaded in assertions are known to exist
    files: ["tests/**/*.ts"],
    rules: { "@typescript-eslint/no-non-null-assertion": "off" },
  },
  prettier,
);
