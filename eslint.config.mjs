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
    },
  },
  {
    ignores: [".next/**", "node_modules/**", "coverage/**", "playwright-report/**"],
  },
];

export default config;
