// apps/worker/src/admin/metrics.ts
import "dotenv/config";
import {
  getMetricsByRange,
  getDailyMetrics,
  getTopExpensiveJobs
} from "../lib/metrics.js";

/* ===========================
   HELPERS
=========================== */

function printHeader(title: string) {
  console.log("\n====================================");
  console.log(title);
  console.log("====================================");
}

function printMetrics(m: any) {
  console.table({
    "Total jobs": m.totalJobs,
    "Success jobs": m.successJobs,
    "Failed jobs": m.failedJobs,
    "Success rate (%)": m.successRate,
    "Avg duration (ms)": m.avgDurationMs,
    "P95 duration (ms)": m.p95DurationMs,
    "Total cost": m.totalCost,
    "Avg cost / job": m.avgCostPerJob
  });
}

/* ===========================
   COMMANDS
=========================== */

async function today() {
  const from = new Date();
  from.setHours(0, 0, 0, 0);

  const to = new Date();

  printHeader("📊 METRICS — TODAY");
  const metrics = await getMetricsByRange({ from, to });
  printMetrics(metrics);
}

async function week() {
  printHeader("📊 METRICS — LAST 7 DAYS");
  const rows = await getDailyMetrics(7);
  console.table(rows);
}

async function top() {
  printHeader("💰 TOP EXPENSIVE JOBS");
  const rows = await getTopExpensiveJobs(10);
  console.table(rows);
}

/* ===========================
   CLI
=========================== */

async function main() {
  const [, , cmd] = process.argv;

  switch (cmd) {
    case "today":
      await today();
      break;

    case "week":
      await week();
      break;

    case "top":
      await top();
      break;

    default:
      console.log(`
ADMIN METRICS

Usage:
  pnpm tsx src/admin/metrics.ts today
  pnpm tsx src/admin/metrics.ts week
  pnpm tsx src/admin/metrics.ts top
`);
  }

  process.exit(0);
}

main().catch((e) => {
  console.error("Metrics admin error:", e);
  process.exit(1);
});
