import { getDb } from "@/src/db";
import { handleMcpRequest } from "@/src/transports/mcp";

export const maxDuration = 300;
export async function POST(request: Request) {
  return handleMcpRequest(request, { db: getDb() });
}
export function GET() {
  return Response.json(
    { error: "method_not_allowed" },
    { status: 405, headers: { Allow: "POST" } },
  );
}
export const DELETE = GET;
