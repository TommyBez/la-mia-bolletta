import { billError } from "@/src/modules/bill/http";
import { authorizedBillJob } from "@/src/modules/bill/repository";
import { readPrivateBillFile } from "@/src/modules/bill/service";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobId: string; fileId: string }> },
) {
  try {
    const { jobId, fileId } = await params;
    const job = await authorizedBillJob(
      jobId,
      request.headers.get("x-bill-capability"),
    );
    const file = job.files.find((f) => f.id === fileId);
    if (!file) return new Response(null, { status: 404 });
    return new Response(await readPrivateBillFile(file.pathname, file.size), {
      headers: {
        "Content-Type": file.contentType,
        "Cache-Control": "private, no-store",
        "Content-Disposition": "attachment; filename=bolletta",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return billError(error);
  }
}
