import { sql } from "drizzle-orm";
import type { AppDb } from "../../db";
import { referencePublished, referenceSets } from "../../db/schema/catalog";

export async function searchMunicipalities(db: AppDb, query: string) {
  const text = query.trim().slice(0, 80);
  if (text.length < 2) return { items: [] };
  const result = await db.execute<{
    portalCode: string;
    name: string;
    referenceVersionId: string;
  }>(sql`
    select location->>'code' as "portalCode", location->>'name' as "name", ${referenceSets.id} as "referenceVersionId"
    from ${referencePublished}
    join ${referenceSets} on ${referencePublished.referenceVersionId} = ${referenceSets.id},
    lateral jsonb_array_elements(${referenceSets.payload}->'portalMunicipalities') as location
    where ${referencePublished.scope} = 'national'
      and (strpos(lower(location->>'name'), lower(${text})) > 0 or location->>'code' = ${text})
    order by starts_with(lower(location->>'name'), lower(${text})) desc, location->>'name', location->>'code'
    limit 20
  `);
  return { items: result.rows };
}
