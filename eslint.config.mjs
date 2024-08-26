import eslint from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import eslintPluginSvelte from "eslint-plugin-svelte";
import globals from "globals";
import svelteParser from "svelte-eslint-parser";
import tseslint from "typescript-eslint";

/**
 * Workaround for https://github.com/sveltejs/eslint-plugin-svelte/pull/789#issuecomment-2309033145
 *
 * @type {{
 *    [K in keyof typeof eslintPluginSvelte["configs"]]:
 *      typeof eslintPluginSvelte["configs"][K] extends unknown[]
 *        ? import("eslint").Linter.Config[]
 *        : import("eslint").Linter.Config
 * }} */
const eslintPluginSvelteConfigs = eslintPluginSvelte.configs;

/**
 * Note: must be consistent per tsconfig project: https://github.com/typescript-eslint/typescript-eslint/issues/6778#issuecomment-1484725834
 * @type {import("@typescript-eslint/parser").ParserOptions}
 */
const parserOptions = {
  projectService: {
    allowDefaultProject: ["*.js", "*.mjs"],
    defaultProject: "tsconfig.default.json",
  },
  tsconfigRootDir: import.meta.dirname,
  extraFileExtensions: [".svelte"],
};

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...eslintPluginSvelteConfigs["flat/recommended"],
  ...eslintPluginSvelteConfigs["flat/prettier"],
  {
    languageOptions: {
      parser: tsParser,
      parserOptions,
    },
    rules: {
      "object-shorthand": ["error", "always"],
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-unnecessary-condition": [
        "error",
        { allowConstantLoopConditions: true },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/switch-exhaustiveness-check": "error",
    },
  },
  {
    files: ["**/*.svelte", "*.svelte"],
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: tsParser,
        ...parserOptions,
      },
      globals: {
        ...globals.browser,
      },
    },
  },
);
