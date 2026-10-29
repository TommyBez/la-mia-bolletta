import { billError } from "@/src/modules/bill/http";
import { runBillExtraction } from "@/src/modules/bill/service";
export const maxDuration = 240;
export async function POST(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  try {
    const result = await runBillExtraction(
      (await params).jobId,
      request.headers.get("x-bill-capability"),
    );
    return Response.json(result, {
      status:
        result.status === "busy" || result.status === "capacity" ? 409 : 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return billError(error);
  }
}
