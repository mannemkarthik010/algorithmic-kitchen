import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vendored third-party source installed through the shadcn registry (Bklit charts, MIT). Not linted here.
    "components/charts/**",
    // Same for Kokonut UI components installed from its public registry (MIT) and customised.
    "components/kokonutui/**",
    "app/components/ui/**",
  ]),
]);

export default eslintConfig;
