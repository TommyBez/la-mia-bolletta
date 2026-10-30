import type { AppDb } from "../db";
import { createOperations, type Operation } from "./operations";

async function readBoundedJson(request: Request) {
  const limit = 256 * 1024;
  if (Number(request.headers.get("content-length") ?? 0) > limit)
    throw new Error("body_too_large");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("invalid_json");
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.byteLength;
      if (size > limit) throw new Error("body_too_large");
      chunks.push(part.value);
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } finally {
    await reader.cancel();
  }
}

export async function handleWebRequest(
  operation: Operation,
  request: Request,
  { db }: { db: AppDb },
) {
  let input: unknown = {};
  if (operation !== "get_data_status") {
    try {
      input = await readBoundedJson(request);
    } catch (error) {
      return Response.json(
        {
          status: "needs_input",
          issues: [
            {
              path: "request",
              message:
                error instanceof Error && error.message === "body_too_large"
                  ? "Richiesta troppo grande."
                  : "Richiesta JSON non valida.",
            },
          ],
        },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }
  }
  const result = await createOperations(db)(operation, input);
  return Response.json(result, { headers: { "Cache-Control": "no-store" } });
}
