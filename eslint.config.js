import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/**", "coverage/**", "node_modules/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { window: "readonly", document: "readonly", localStorage: "readonly",
        sessionStorage: "readonly", navigator: "readonly", console: "readonly",
        setTimeout: "readonly", clearTimeout: "readonly", crypto: "readonly",
        URL: "readonly", Blob: "readonly", fetch: "readonly", DOMParser: "readonly",
        KeyboardEvent: "readonly", HTMLElement: "readonly", Node: "readonly",
        TextEncoder: "readonly", requestAnimationFrame: "readonly" },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/consistent-type-imports": "error",
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message: "Dilarang: XSS risk (technical-design §9)."
        }
      ],
      "no-restricted-imports": [
        "error",
        {
          paths: [
            { name: "react", importNames: ["default"], message: "Pakai named import." }
          ]
        }
      ]
    },
  },
  {
    // Service worker berjalan di ServiceWorkerGlobalScope, bukan di window.
    files: ["public/sw.js"],
    languageOptions: {
      globals: {
        self: "readonly",
        caches: "readonly",
        fetch: "readonly",
        URL: "readonly",
        Response: "readonly",
        console: "readonly",
      },
    },
  },
  {
    files: ["scripts/**/*.mjs", "*.config.{js,ts}"],
    languageOptions: {
      globals: {
        process: "readonly",
        console: "readonly",
        URL: "readonly",
        fetch: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
      },
    },
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
);
