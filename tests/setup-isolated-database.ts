import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { afterAll } from "vitest";
import { closeDatabases, createDb } from "../src/db";
import { migrateDatabase } from "../src/db/migrate";

const connectionString = process.env.TEST_DATABASE_URL;
if (connectionString) {
  const url = new URL(connectionString);
  if (
    !["127.0.0.1", "localhost"].includes(url.hostname) ||
    url.port !== "55432" ||
    !url.pathname.startsWith("/lmb_test")
  ) {
    throw new Error(
      "Tests require the isolated local PostgreSQL instance on port 55432",
    );
  }
  const databaseName = `lmb_suite_${randomUUID().replaceAll("-", "")}`;
  const admin = new Pool({ connectionString, max: 1 });
  await admin.query(`CREATE DATABASE "${databaseName}"`);
  url.pathname = `/${databaseName}`;
  process.env.TEST_DATABASE_URL = url.href;
  process.env.DATABASE_URL = url.href;
  const migrationDb = createDb(url.href);
  try {
    await migrateDatabase(migrationDb);
  } finally {
    await migrationDb.$client.end();
  }
  afterAll(async () => {
    try {
      await closeDatabases();
      await admin.query(`DROP DATABASE "${databaseName}"`);
    } finally {
      await admin.end();
    }
  });
}
