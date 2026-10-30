import { getDb } from "@/src/db";
import { handleWebRequest } from "@/src/transports/web";

export const maxDuration = 300;
export async function POST(request: Request) {
  return handleWebRequest("compare_offers", request, { db: getDb() });
}
