import { getDb } from "@/src/db";
import { createOperations } from "@/src/transports/operations";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const result = await createOperations(getDb())("get_data_status", {
    offerQuery: {
      code: params.get("code"),
      commodity: params.get("commodity"),
    },
  });
  return Response.json(result, { headers: { "Cache-Control": "no-store" } });
}
