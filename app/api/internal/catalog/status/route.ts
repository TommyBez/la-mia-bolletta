import { getCatalogService } from "@/src/modules/catalog/runtime";
import { isInternalRequest } from "@/src/server/internal-auth";
export async function GET(request: Request) {
  if (!isInternalRequest(request))
    return Response.json({ error: "unauthorized" }, { status: 401 });
  const service = getCatalogService();
  const statuses = await Promise.all(
    ["electricity", "gas"].map((commodity) =>
      service.getCatalogStatus({
        commodity: commodity as "electricity" | "gas",
      }),
    ),
  );
  return Response.json({ statuses });
}
