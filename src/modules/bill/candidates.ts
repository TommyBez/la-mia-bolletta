import { z } from "zod";
import type { BillExtraction } from "./extraction";
export type DocumentFieldCandidate = {
  value: string | null;
  originalValues: (string | null)[];
  state: "present" | "missing" | "ambiguous" | "invalid";
  origin: "document";
  documentId: string;
  fileId?: string;
  page?: number;
  excerpt?: string;
};
/** This seam deliberately cannot produce a confirmed consumption profile. */
export function candidateFromExtraction(
  extraction: BillExtraction,
  documentId: string,
) {
  return extraction.supplies.map((supply) => {
    const fields: Record<string, DocumentFieldCandidate> = {};
    const warnings = [...supply.warnings];
    for (const field of supply.fields) {
      let value = field.value;
      const isDate =
        /annualConsumption\.period\.(from|to)$|contract\.valid(From|Until)$/.test(
          field.path,
        );
      if (isDate && value !== null) {
        const italian = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
        if (italian) value = `${italian[3]}-${italian[2]}-${italian[1]}`;
      }
      const previous = fields[field.path];
      if (previous && previous.value !== value) {
        fields[field.path] = {
          ...previous,
          value: null,
          state: "ambiguous",
          originalValues: [...previous.originalValues, field.value],
        };
        warnings.push(
          `Valori discordanti per ${field.path}: serve una verifica manuale.`,
        );
        continue;
      }
      const invalid =
        value !== null &&
        ((isDate && !z.iso.date().safeParse(value).success) ||
          (/\.value$|\.powerKw$|\.bands\.F[123]$|\.unitPrice$|\.fixedAnnualCharge$/.test(
            field.path,
          ) &&
            !/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value)) ||
          (field.path === "electricity.resident" &&
            !["true", "false"].includes(value)));
      fields[field.path] = {
        value: invalid ? null : value,
        originalValues: [field.value],
        state: invalid
          ? "invalid"
          : field.value === null
            ? "missing"
            : "present",
        origin: "document",
        documentId,
        ...(field.evidence
          ? {
              fileId: field.evidence.fileId,
              ...(field.evidence.page ? { page: field.evidence.page } : {}),
              excerpt: field.evidence.excerpt,
            }
          : {}),
      };
      if (invalid) warnings.push(`Formato da verificare per ${field.path}.`);
    }
    return {
      commodity: supply.commodity,
      confirmed: false as const,
      fields,
      warnings,
    };
  });
}
