import { generateText, Output } from "ai";
import {
  BillExtractionProviderSchema,
  BillExtractionSchema,
  OCR_MODEL,
  OCR_SYSTEM,
} from "./extraction";
export type OcrInput = {
  id: string;
  name: string;
  contentType: string;
  bytes: Uint8Array;
};
export async function extractBill(files: OcrInput[], signal: AbortSignal) {
  // The SDK resolves OIDC from the Vercel request context in deployed functions,
  // and from the local token after `vercel env pull` during development.
  const response = await generateText({
    model: OCR_MODEL,
    system: `${OCR_SYSTEM} Percorsi ammessi: municipality.name, municipality.portalCode, annualConsumption.value, annualConsumption.unit, annualConsumption.kind, annualConsumption.period.from, annualConsumption.period.to, electricity.powerKw, electricity.resident, electricity.bands.F1, electricity.bands.F2, electricity.bands.F3, gas.usage, gas.meterClass, contract.offerCode, contract.supplier, contract.priceKind, contract.validUntil, contract.validFrom, contract.unitPrice, contract.index, contract.indexMultiplier, contract.spread, contract.fixedAnnualCharge.`,
    output: Output.object({ schema: BillExtractionProviderSchema }),
    maxOutputTokens: 6000,
    maxRetries: 0,
    abortSignal: signal,
    messages: [
      {
        role: "user",
        content: files.flatMap((file) => [
          {
            type: "text" as const,
            text: `Documento fileId=${file.id}; nome=${file.name}`,
          },
          {
            type: "file" as const,
            data: file.bytes,
            mediaType: file.contentType,
            filename: file.name,
          },
        ]),
      },
    ],
  });
  return {
    output: BillExtractionSchema.parse(response.output),
    usage: response.usage,
    providerMetadata: response.providerMetadata,
    response: response.response,
  };
}
export function isTransientOcrError(error: unknown) {
  if (
    error instanceof Error &&
    ["AbortError", "TimeoutError"].includes(error.name)
  )
    return true;
  const status = (error as { statusCode?: number })?.statusCode;
  return (
    status === 408 ||
    status === 429 ||
    (typeof status === "number" && status >= 500)
  );
}
