import typescriptEslint from "@typescript-eslint/eslint-plugin";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";
import { fixupConfigRules } from "@eslint/compat";
import gitignore from "eslint-config-flat-gitignore";
/** The @eslint/eslintrc package provides a FlatCompat class that makes it easy
 * to continue using eslintrc-style shared configs and settings within a flat
 * config file. [...] Using the FlatCompat class allows you to continue using
 * all of your existing eslintrc files while optimizing them for use with flat
 * config. We envision this as a necessary transitional step to allow the
 * ecosystem to slowly convert over to flat config.
 * https://eslint.org/blog/2022/08/new-config-system-part-2 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  // Look for the nearest gitignore file and use it, this is useful for
  // monorepos where the root gitignore file is in a different directory
  gitignore(),

  ...fixupConfigRules(
    compat.extends("airbnb-base", "prettier", "plugin:import/typescript"),
  ),
  {
    files: ["packages/*/src/**/*.+(ts|js)"],
    plugins: {
      "@typescript-eslint": typescriptEslint,
    },

    languageOptions: {
      globals: {
        ...globals.commonjs,
        ...globals.node,
        ...globals.browser,
        Atomics: "readonly",
        SharedArrayBuffer: "readonly",
      },

      parser: tsParser,
    },

    settings: {
      "import/resolver": {
        node: {
          extensions: [".js", ".jsx", ".ts", ".tsx"],
        },
      },
    },

    rules: {
      "no-shadow": "off",
      "@typescript-eslint/no-shadow": "off",

      "class-methods-use-this": [1],
      "no-underscore-dangle": [0],

      // Note: disable the base rule to use the @typescript-eslint instead as
      // it can report incorrect errors
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          args: "all",
          argsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],

      camelcase: 2,
      "arrow-body-style": 0,
      "no-mixed-spaces-and-tabs": 2,

      "max-len": [
        2,
        {
          code: 120,
          tabWidth: 2,
          ignoreUrls: true,
        },
      ],

      "import/extensions": [
        "error",
        "ignorePackages",
        {
          js: "always",
          ts: "always",
        },
      ],
      "import/no-unresolved": [0],

      // Already checked by TypeScript
      "no-dupe-class-members": "off",

      "import/prefer-default-export": "off",
      "lines-between-class-members": "off",
    },
  },
];
