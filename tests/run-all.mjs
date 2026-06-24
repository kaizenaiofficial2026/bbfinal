#!/usr/bin/env node
/**
 * One-command production-readiness gate. Runs every layer in sequence and
 * prints a single summary. Exits non-zero if any stage fails.
 *
 *   npm run test:all
 *
 * Stages: type-check → lint → unit/component (+coverage) → security audit →
 * E2E (flows, responsiveness, accessibility, SEO, performance, headers).
 */
import { spawnSync } from "node:child_process";

const STAGES = [
  { name: "Type check (tsc)", cmd: "npm", args: ["run", "typecheck"] },
  { name: "Lint (eslint)", cmd: "npm", args: ["run", "lint"] },
  {
    name: "Unit & component + coverage (vitest)",
    cmd: "npx",
    args: ["vitest", "run", "--coverage"],
  },
  {
    name: "Integration — test DB (vitest)",
    cmd: "npx",
    args: ["vitest", "run", "-c", "vitest.integration.config.ts"],
  },
  {
    name: "Security audit",
    cmd: "node",
    args: ["tests/security/audit.mjs"],
  },
  {
    name: "E2E · responsive · a11y · SEO · perf (playwright)",
    cmd: "npx",
    args: ["playwright", "test"],
  },
];

const line = "━".repeat(66);
const banner = (t) =>
  console.log(`\n\x1b[36m\x1b[1m${line}\n  ${t}\n${line}\x1b[0m`);

const results = [];
for (const stage of STAGES) {
  banner(`▶ ${stage.name}`);
  const start = Date.now();
  const run = spawnSync(stage.cmd, stage.args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  results.push({
    name: stage.name,
    ok: run.status === 0,
    sec: ((Date.now() - start) / 1000).toFixed(1),
  });
}

banner("Summary");
let allOk = true;
for (const r of results) {
  if (!r.ok) allOk = false;
  const mark = r.ok ? "\x1b[32m PASS \x1b[0m" : "\x1b[31m FAIL \x1b[0m";
  console.log(`  [${mark}] ${r.name.padEnd(50)} ${r.sec.padStart(6)}s`);
}
console.log("");
console.log(
  allOk
    ? "\x1b[32m\x1b[1m✓ All production-readiness gates are green.\x1b[0m"
    : "\x1b[31m\x1b[1m✗ One or more gates failed — see the output above.\x1b[0m",
);
process.exit(allOk ? 0 : 1);
