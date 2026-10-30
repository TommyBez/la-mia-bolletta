import { randomUUID } from "node:crypto";
import { get } from "@vercel/blob";
import { estimateOcrCost, OCR_MODEL, OCR_PROMPT_VERSION } from "./extraction";
import { BillInputError, inspectBillFile } from "./files";
import { extractBill, isTransientOcrError, type OcrInput } from "./provider";
import {
  authorizedBillJob,
  claimBillJob,
  completeBillJob,
  failBillJob,
  recordBillAttempt,
  recordVerifiedBillFiles,
} from "./repository";
export async function readPrivateBillFile(pathname: string, size: number) {
  const blob = await get(pathname, { access: "private", useCache: false });
  if (!blob || blob.statusCode !== 200)
    throw new BillInputError(
      "Il caricamento non è completo: riprova.",
      "upload_incomplete",
    );
  if (blob.blob.size !== size || blob.blob.size > 10 * 1024 * 1024)
    throw new BillInputError("Dimensione del file non valida.");
  const reader = blob.stream.getReader();
  const parts: Uint8Array[] = [];
  let actual = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      actual += chunk.value.length;
      if (actual > size)
        throw new BillInputError("Dimensione del file non valida.");
      parts.push(chunk.value);
    }
  } finally {
    await reader.cancel();
  }
  return Buffer.concat(parts);
}
export async function runBillExtraction(id: string, capability: string | null) {
  const job = await authorizedBillJob(id, capability);
  const claim = await claimBillJob(id);
  if (claim.status === "complete")
    return { status: "complete" as const, result: claim.result };
  if (claim.status !== "claimed") return { status: claim.status };
  try {
    const files: OcrInput[] = [];
    for (const file of job.files) {
      const bytes = await readPrivateBillFile(file.pathname, file.size);
      const verified = await inspectBillFile(bytes, file);
      Object.assign(file, verified, { verifiedAt: new Date().toISOString() });
      files.push({
        id: file.id,
        name: file.name,
        contentType: file.contentType,
        bytes,
      });
    }
    await recordVerifiedBillFiles(id, job.files, claim.leaseUntil);
    const deadline = Date.now() + 180000;
    for (let attempt = 0; attempt < 2; attempt++) {
      const started = Date.now();
      try {
        const response = await extractBill(
          files,
          AbortSignal.timeout(
            Math.min(90000, Math.max(1, deadline - Date.now())),
          ),
        );
        const usage = response.usage;
        await recordBillAttempt({
          id: randomUUID(),
          jobId: id,
          model: OCR_MODEL,
          promptVersion: OCR_PROMPT_VERSION,
          state: "complete",
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          estimatedCostUsd:
            usage.inputTokens !== undefined && usage.outputTokens !== undefined
              ? estimateOcrCost(
                  usage.inputTokens,
                  usage.outputTokens,
                  new Date(),
                )
              : null,
          usage: {
            ...usage,
            gateway: response.providerMetadata,
            rateCard: "gateway-google-standard-2026-10-29",
            costKind: response.providerMetadata?.gateway?.cost
              ? "gateway_reported"
              : "estimate",
            billedCostUsd: response.providerMetadata?.gateway?.cost ?? null,
          },
          durationMs: Date.now() - started,
        });
        const extraction = response.output;
        for (const supply of extraction.supplies)
          for (const field of supply.fields) {
            if (
              field.evidence &&
              !files.some((f) => f.id === field.evidence?.fileId)
            )
              field.evidence = null;
          }
        await completeBillJob(id, extraction, claim.leaseUntil);
        return { status: "complete" as const, result: extraction };
      } catch (error) {
        await recordBillAttempt({
          id: randomUUID(),
          jobId: id,
          model: OCR_MODEL,
          promptVersion: OCR_PROMPT_VERSION,
          state: "failed",
          durationMs: Date.now() - started,
          errorCode: isTransientOcrError(error)
            ? "transient"
            : "provider_or_output_error",
          usage: { costKind: "unknown_failed_attempt" },
        });
        if (
          attempt === 1 ||
          !isTransientOcrError(error) ||
          Date.now() >= deadline
        )
          throw error;
      }
    }
    throw new Error("ocr_timeout");
  } catch (error) {
    const code =
      error instanceof BillInputError
        ? error.code
        : error instanceof Error && error.message.startsWith("ocr_")
          ? error.message
          : "ocr_unavailable";
    await failBillJob(id, code, claim.leaseUntil);
    throw error instanceof BillInputError
      ? error
      : new BillInputError(
          "La lettura della bolletta non è disponibile. Puoi riprovare o inserire i dati a mano.",
          code,
        );
  }
}
