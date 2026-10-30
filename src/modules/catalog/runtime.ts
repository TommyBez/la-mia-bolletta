import { getDb } from "../../db";
import { acquireGasSaleSupplement } from "../comparison/gas/supplement-acquisition";
import { createBlobOriginalStore } from "./originals";
import { createCatalogService } from "./service";
import { createOfficialSource } from "./source";
export function getCatalogService() {
  return createCatalogService({
    db: getDb(),
    source: createOfficialSource(),
    originals: createBlobOriginalStore(),
    supplementAcquirer: acquireGasSaleSupplement,
  });
}
