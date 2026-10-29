import { getDb } from "@/src/db";
import { handleWebRequest } from "@/src/transports/web";

export const maxDuration = 300;
export async function GET(request: Request) {
  return handleWebRequest("get_data_status", request, { db: getDb() });
}
