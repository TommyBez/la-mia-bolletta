import type { AppDb } from "../../db";
import type { catalogSnapshots } from "../../db/schema/catalog";
import type { ReferenceBundle } from "../references/registry";
import type { Commodity, NormalizedOffer } from "./normalize";
export type ImmutableCatalogSnapshot = {
  snapshot: typeof catalogSnapshots.$inferSelect;
  offers: NormalizedOffer[];
};
type Cache = {
  snapshots: Record<
    Commodity,
    Map<string, Promise<ImmutableCatalogSnapshot | null>>
  >;
  references: Map<string, Promise<ReferenceBundle | null>>;
};
const databases = new WeakMap<AppDb, Cache>();
export function catalogCache(db: AppDb): Cache {
  let cache = databases.get(db);
  if (!cache) {
    cache = {
      snapshots: { electricity: new Map(), gas: new Map() },
      references: new Map(),
    };
    databases.set(db, cache);
  }
  return cache;
}
/** Values are keyed exclusively by immutable data versions, never household data. */
export function versionCached<T>(
  cache: Map<string, Promise<T>>,
  key: string,
  load: () => Promise<T>,
  maximum: number,
): Promise<T> {
  const found = cache.get(key);
  if (found) {
    cache.delete(key);
    cache.set(key, found);
    return found;
  }
  const pending = load()
    .then((value) => deepFreeze(value))
    .catch((error) => {
      if (cache.get(key) === pending) cache.delete(key);
      throw error;
    });
  cache.set(key, pending);
  while (cache.size > maximum) {
    const oldest = cache.keys().next().value;
    if (oldest === undefined) break;
    cache.delete(oldest);
  }
  return pending;
}
function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}
