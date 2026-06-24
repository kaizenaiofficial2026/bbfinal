#!/usr/bin/env node
/**
 * Static security audit — runnable on its own (`node tests/security/audit.mjs`)
 * and as a stage of the full suite. Non-zero exit on any hard failure.
 *
 * Checks: production dependency vulnerabilities, committed secrets, hardcoded
 * secret material, server-only key leakage into client bundles, and dangerous
 * code patterns.
 */
import { execSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

let failures = 0;
let warnings = 0;
const fail = (m) => {
  console.log(`  \x1b[31m✖\x1b[0m ${m}`);
  failures += 1;
};
const pass = (m) => console.log(`  \x1b[32m✓\x1b[0m ${m}`);
const warn = (m) => {
  console.log(`  \x1b[33m⚠\x1b[0m ${m}`);
  warnings += 1;
};

const SRC_DIRS = ["app", "components", "lib", "i18n", "proxy.ts"];
const CODE_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs"]);

function walk(path, files = []) {
  let st;
  try {
    st = statSync(path);
  } catch {
    return files;
  }
  if (st.isFile()) {
    if (CODE_EXT.has(extname(path))) files.push(path);
    return files;
  }
  for (const entry of readdirSync(path)) {
    if (["node_modules", ".next", ".git", "test-results"].includes(entry)) continue;
    walk(join(path, entry), files);
  }
  return files;
}

const sourceFiles = SRC_DIRS.flatMap((d) => walk(d));

// ── 1. Dependency vulnerabilities ──────────────────────────────────────────
console.log("\n[1] Production dependency vulnerabilities");
function readAudit() {
  try {
    return JSON.parse(
      execSync("npm audit --omit=dev --json", { encoding: "utf8" }),
    );
  } catch (e) {
    // npm audit exits non-zero when vulnerabilities exist; JSON is on stdout.
    if (e.stdout) {
      try {
        return JSON.parse(e.stdout);
      } catch {
        /* fall through */
      }
    }
    return null;
  }
}
const audit = readAudit();
if (!audit) {
  warn("npm audit unavailable (offline?) — skipped");
} else {
  const v = audit.metadata?.vulnerabilities ?? {};
  const blocking = (v.critical ?? 0) + (v.high ?? 0);
  if (blocking > 0) {
    fail(`${blocking} high/critical prod vulnerabilities (critical ${v.critical}, high ${v.high})`);
  } else {
    pass(`no high/critical prod vulnerabilities (moderate ${v.moderate ?? 0}, low ${v.low ?? 0})`);
  }
}

// ── 2. Secret files must not be committed ──────────────────────────────────
console.log("\n[2] Secret files are not committed");
try {
  const tracked = execSync(
    "git ls-files .env .env.local .env.production .env.development",
    { encoding: "utf8" },
  ).trim();
  if (tracked) fail(`secret env file(s) committed to git: ${tracked.replace(/\n/g, ", ")}`);
  else pass(".env files are gitignored (not committed)");
} catch {
  warn("git not available — skipped committed-secrets check");
}

// ── 3. No hardcoded secret material in source ──────────────────────────────
console.log("\n[3] No hardcoded secrets in source");
const SECRET_PATTERNS = [
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, "private key"],
  [/AKIA[0-9A-Z]{16}/, "AWS access key id"],
  [/\bsk-[A-Za-z0-9]{24,}\b/, "secret API key (sk-…)"],
  [/eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{10,}/, "hardcoded JWT (Supabase/JWT key)"],
];
let secretHits = 0;
for (const file of sourceFiles) {
  const text = readFileSync(file, "utf8");
  for (const [re, label] of SECRET_PATTERNS) {
    if (re.test(text)) {
      fail(`${label} appears hardcoded in ${file}`);
      secretHits += 1;
    }
  }
}
if (secretHits === 0) pass("no private keys / JWTs / API secrets hardcoded in app source");

// ── 4. Service-role key never reaches client bundles ───────────────────────
console.log("\n[4] Service-role key stays server-only");
let clientLeaks = 0;
for (const file of sourceFiles) {
  const text = readFileSync(file, "utf8");
  const isClient = /^\s*["']use client["']/m.test(text.slice(0, 200));
  if (
    isClient &&
    /(SUPABASE_SERVICE_ROLE_KEY|createSupabaseServiceClient|supabaseServiceRoleKey)/.test(
      text,
    )
  ) {
    fail(`client component references the service-role key: ${file}`);
    clientLeaks += 1;
  }
}
if (clientLeaks === 0) pass("no 'use client' file references the Supabase service-role key");

// ── 5. Dangerous code patterns ─────────────────────────────────────────────
console.log("\n[5] Dangerous code patterns");
let evalHits = 0;
let htmlHits = 0;
for (const file of sourceFiles) {
  const text = readFileSync(file, "utf8");
  if (/\beval\s*\(/.test(text) || /\bnew Function\s*\(/.test(text)) {
    fail(`eval()/new Function() used in ${file}`);
    evalHits += 1;
  }
  if (/dangerouslySetInnerHTML/.test(text)) htmlHits += 1;
}
if (evalHits === 0) pass("no eval()/new Function() in app source");
if (htmlHits > 0)
  warn(`${htmlHits} file(s) use dangerouslySetInnerHTML — confirm inputs are trusted/sanitised`);
else pass("no dangerouslySetInnerHTML usage");

// ── Summary ────────────────────────────────────────────────────────────────
console.log(
  `\nSecurity audit: ${failures === 0 ? "\x1b[32mPASS\x1b[0m" : `\x1b[31m${failures} FAILURE(S)\x1b[0m`}` +
    (warnings ? ` · ${warnings} warning(s)` : ""),
);
process.exit(failures === 0 ? 0 : 1);
