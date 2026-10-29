import { loadEnvConfig } from "@next/env";
import { createDb } from "../../src/db";
import { migrateDatabase } from "../../src/db/migrate";

async function main() {
  loadEnvConfig(process.cwd());
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");
  const db = createDb(url);
  try {
    await migrateDatabase(db);
    console.log("Database migrations applied");
  } finally {
    await db.$client.end();
  }
}

main().catch(() => {
  console.error("Database migration failed; no credentials logged");
  process.exitCode = 1;
});
