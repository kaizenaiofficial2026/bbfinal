/**
 * Dependency-free load/stress test. Maintains a pool of CONCURRENCY workers, each
 * looping over a weighted mix of public GET routes (no rate limits, no email/DB
 * writes) until DURATION_MS elapses, then reports latency percentiles, throughput
 * and status-code distribution.
 *
 * Usage: node scripts/loadtest.mjs [concurrency] [durationSeconds] [baseUrl]
 */
const CONCURRENCY = Number(process.argv[2] ?? 100);
const DURATION_MS = Number(process.argv[3] ?? 30) * 1000;
const BASE = process.argv[4] ?? "http://localhost:3000";

// Weighted route mix — a homepage-heavy browse with tour/destination/detail pages.
// The package detail also exercises the next/image-backed page we just fixed.
const ROUTES = [
  { path: "/en", weight: 3 },
  { path: "/en/tours", weight: 3 },
  { path: "/en/destinations", weight: 2 },
  { path: "/en/booking/qa-supaimg-pkg", weight: 2 },
  { path: "/en/about", weight: 1 },
  { path: "/en/contacts", weight: 1 },
];
const POOL = ROUTES.flatMap((r) => Array(r.weight).fill(r.path));

const latencies = [];
const statusCounts = new Map();
let errors = 0;
let done = false;

function pick() {
  return POOL[Math.floor(Math.random() * POOL.length)];
}

async function worker() {
  while (!done) {
    const path = pick();
    const start = performance.now();
    try {
      const res = await fetch(BASE + path, { redirect: "follow" });
      // Drain the body so timing reflects a full response, like a real client.
      await res.arrayBuffer();
      const ms = performance.now() - start;
      latencies.push(ms);
      statusCounts.set(res.status, (statusCounts.get(res.status) ?? 0) + 1);
    } catch {
      errors += 1;
    }
  }
}

function pct(sorted, p) {
  if (sorted.length === 0) return 0;
  const i = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[i];
}

async function main() {
  console.log(
    `Load test → ${BASE}  |  concurrency=${CONCURRENCY}  duration=${DURATION_MS / 1000}s\n` +
      `Routes: ${ROUTES.map((r) => `${r.path}(x${r.weight})`).join(", ")}\n`,
  );
  const wallStart = performance.now();
  const stop = setTimeout(() => {
    done = true;
  }, DURATION_MS);

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  clearTimeout(stop);

  const wallSec = (performance.now() - wallStart) / 1000;
  const sorted = latencies.slice().sort((a, b) => a - b);
  const total = latencies.length + errors;
  const ok2xx3xx = [...statusCounts.entries()]
    .filter(([s]) => s >= 200 && s < 400)
    .reduce((a, [, c]) => a + c, 0);

  const sum = sorted.reduce((a, b) => a + b, 0);
  console.log("──────────── RESULTS ────────────");
  console.log(`Total requests : ${total}`);
  console.log(`Completed      : ${latencies.length}`);
  console.log(`Errors (conn)  : ${errors}`);
  console.log(`Throughput     : ${(latencies.length / wallSec).toFixed(1)} req/s`);
  console.log(
    `Success (2xx/3xx): ${ok2xx3xx}/${latencies.length} (${((ok2xx3xx / Math.max(1, latencies.length)) * 100).toFixed(2)}%)`,
  );
  console.log("Latency (ms):");
  console.log(`  avg ${(sum / Math.max(1, sorted.length)).toFixed(1)}`);
  console.log(`  min ${sorted[0]?.toFixed(1) ?? 0}`);
  console.log(`  p50 ${pct(sorted, 50).toFixed(1)}`);
  console.log(`  p90 ${pct(sorted, 90).toFixed(1)}`);
  console.log(`  p95 ${pct(sorted, 95).toFixed(1)}`);
  console.log(`  p99 ${pct(sorted, 99).toFixed(1)}`);
  console.log(`  max ${sorted[sorted.length - 1]?.toFixed(1) ?? 0}`);
  console.log("Status codes:");
  for (const [s, c] of [...statusCounts.entries()].sort((a, b) => a[0] - b[0])) {
    console.log(`  ${s}: ${c}`);
  }
  console.log("─────────────────────────────────");
}

main();
