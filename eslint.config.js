import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "src-tauri", "node_modules"] },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],

      // Architectural boundaries: features must stay isolated from each other.
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features/*/*"],
              message:
                "Deep imports into a feature are forbidden. Import from the feature's public API (its index.ts) instead.",
            },
          ],
        },
      ],

      // Allow intentionally unused args/vars prefixed with underscore.
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Zustand / TanStack Query idioms rely on inference-friendly patterns.
      "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
    },
  },
  // UI primitives follow the shadcn/ui convention of exporting cva variant
  // objects alongside components; fast-refresh purity does not apply there.
  // The route table exports a router object next to lazy() page wrappers —
  // it is configuration, not a component module.
  {
    files: ["src/components/ui/**/*.tsx", "src/app/router/routes.tsx"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
  // Node-context files (build tooling).
  {
    files: ["vite.config.ts"],
    languageOptions: {
      globals: globals.node,
    },
  },
  prettier,
);
