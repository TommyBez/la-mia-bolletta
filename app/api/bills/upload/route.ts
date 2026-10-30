import { type HandleUploadBody, handleUpload } from "@vercel/blob/client";
import { BillInputError } from "@/src/modules/bill/files";
import { billError, smallJson } from "@/src/modules/bill/http";
import { authorizedBillJob } from "@/src/modules/bill/repository";
export async function POST(request: Request) {
  try {
    const body = (await smallJson(request)) as HandleUploadBody;
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const { jobId } = JSON.parse(clientPayload ?? "{}");
        const job = await authorizedBillJob(
          jobId,
          request.headers.get("x-bill-capability"),
        );
        if (job.state !== "uploading")
          throw new BillInputError("Il caricamento è già concluso.");
        const file = job.files.find((f) => f.pathname === pathname);
        if (!file)
          throw new BillInputError("File non autorizzato.", "unauthorized");
        return {
          allowedContentTypes: [file.contentType],
          maximumSizeInBytes: file.size,
          validUntil: Date.now() + 10 * 60 * 1000,
          addRandomSuffix: false,
          allowOverwrite: false,
        };
      },
    });
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return billError(error);
  }
}
