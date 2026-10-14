import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/*
 * Design system (docs/design-system.md): cores só via tokens semânticos
 * (bg-surface, text-fg-muted, border-line…). Paleta crua do Tailwind e `dark:` são proibidos
 * em componentes — o tema escuro é resolvido pelas variáveis em app/globals.css.
 */
const RAW_COLOR =
  "/(^|[\\s:\"'`])(bg|text|border|ring|outline|divide|decoration|fill|stroke|from|via|to|placeholder|shadow)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|black|white)(-[0-9]{2,3})?(\\/[0-9]+)?([\\s\"'`]|$)/";
const DARK_VARIANT = "/(^|[\\s\"'`])dark:/";
const designSystemMessage =
  "Use tokens do design system (bg-surface, text-fg-muted, border-line, toneClass…) em vez de paleta crua ou dark:. Ver docs/design-system.md.";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["app/**/*.tsx", "components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        { selector: `Literal[value=${RAW_COLOR}]`, message: designSystemMessage },
        { selector: `TemplateElement[value.raw=${RAW_COLOR}]`, message: designSystemMessage },
        { selector: `Literal[value=${DARK_VARIANT}]`, message: designSystemMessage },
        { selector: `TemplateElement[value.raw=${DARK_VARIANT}]`, message: designSystemMessage },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
