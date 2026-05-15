import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: { globals: globals.browser }
  },
  { files: ["**/*.js"], languageOptions: { sourceType: "commonjs" } },
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  {
    rules: {
      "semi": ["warn", "always"],
      "quotes": ["warn", "double"],
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          "args": "after-used",
          "argsIgnorePattern": "^next$",
          "varsIgnorePattern": "^_"
        }
      ],
      "no-restricted-imports": [
        "error",
        {
          "patterns": [
            {
              "group": ["../*"],
              "message": "Parent relative imports (../) are restricted. Use configured path aliases (e.g., @domain/, @application/, @presentation/, @infrastructure/)."
            }
          ]
        }
      ]
    }
  }
]);