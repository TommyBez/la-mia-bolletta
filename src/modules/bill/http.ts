import { BillInputError } from "./files";
export function billError(error: unknown) {
  if (error instanceof SyntaxError)
    return Response.json(
      {
        error: "invalid_request",
        message: "La richiesta non è valida. Controlla i dati e riprova.",
      },
      { status: 422 },
    );
  if (error instanceof BillInputError)
    return Response.json(
      { error: error.code, message: error.message },
      {
        status:
          error.code === "unauthorized"
            ? 403
            : error.code.startsWith("ocr_")
              ? 503
              : 422,
      },
    );
  return Response.json(
    {
      error: "service_unavailable",
      message:
        "Servizio temporaneamente non disponibile. L'inserimento manuale resta disponibile.",
    },
    { status: 503 },
  );
}
export async function smallJson(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw new SyntaxError("missing_body");
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      length += part.value.byteLength;
      if (length > 65536) throw new BillInputError("Richiesta troppo grande.");
      chunks.push(part.value);
    }
  } finally {
    await reader.cancel();
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
