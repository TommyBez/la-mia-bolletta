import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const activePools = new Set<Pool>();

/** Separate instances let integration tests own and close their database pools. */
export function createDb(connectionString: string) {
  const pool = new Pool({
    connectionString,
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
  activePools.add(pool);
  return drizzle(pool);
}

export type AppDb = ReturnType<typeof createDb>;

const pools = new Map<string, AppDb>();

export async function closeDatabases() {
  await Promise.all(
    [...activePools].map((pool) =>
      pool.ending || pool.ended ? Promise.resolve() : pool.end(),
    ),
  );
  activePools.clear();
  pools.clear();
}

export function getDb(connectionString = process.env.DATABASE_URL): AppDb {
  if (!connectionString) throw new Error("DATABASE_URL is required");
  let db = pools.get(connectionString);
  if (!db) {
    db = createDb(connectionString);
    pools.set(connectionString, db);
  }
  return db;
}
