import { loadEnvConfig } from "@next/env";
import { closeDatabases } from "../../src/db";
import { getBillUsage } from "../../src/modules/bill/usage";

async function main() {
  loadEnvConfig(process.cwd());
  const from = process.argv[2];
  const to = process.argv[3];
  if (!from || !to)
    throw new Error(
      "Usage: node --import tsx scripts/bill/usage.ts FROM_ISO TO_ISO",
    );
  try {
    console.log(
      JSON.stringify(
        await getBillUsage({ from: new Date(from), to: new Date(to) }),
        null,
        2,
      ),
    );
  } finally {
    await closeDatabases();
  }
}
main().catch(() => {
  console.error(
    "Usage report unavailable; check the interval and database connection without exposing credentials.",
  );
  process.exitCode = 1;
});
