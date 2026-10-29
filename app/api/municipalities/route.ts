import { getDb } from "@/src/db";
import { createOperations } from "@/src/transports/operations";

export async function GET(request: Request) {
  const municipalityQuery = new URL(request.url).searchParams.get("q") ?? "";
  return Response.json(
    await createOperations(getDb())("get_data_status", { municipalityQuery }),
    { headers: { "Cache-Control": "no-store" } },
  );
}
