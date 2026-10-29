import { resolve } from "node:path";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import type { AppDb } from "./index";

export async function migrateDatabase(db: AppDb) {
  await migrate(db, { migrationsFolder: resolve(process.cwd(), "drizzle") });
}
