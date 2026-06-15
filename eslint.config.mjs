import nextVitals from "eslint-config-next/core-web-vitals";
import reactHooks from "eslint-plugin-react-hooks";

const config = [
  ...nextVitals,
  {
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Stylistic only; copy in the frontend intentionally uses apostrophes
      // inline and renders identically either way.
      "react/no-unescaped-entities": "off",
    },
  },
  {
    ignores: [".next/**", "node_modules/**", "coverage/**", "playwright-report/**"],
  },
];

export default config;
