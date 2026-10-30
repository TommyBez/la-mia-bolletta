import { createHash } from "node:crypto";
import { PDFDocument } from "pdf-lib";

export const BILL_LIMITS = {
  pdfBytes: 10 * 1024 * 1024,
  pdfPages: 20,
  photoBytes: 10 * 1024 * 1024,
  photos: 10,
  photoTotalBytes: 30 * 1024 * 1024,
} as const;
export type BillFile = {
  id: string;
  pathname: string;
  name: string;
  size: number;
  contentType: string;
  sha256?: string;
  pages?: number;
  verifiedAt?: string;
};
export class BillInputError extends Error {
  constructor(
    message: string,
    public code = "invalid_document",
  ) {
    super(message);
  }
}
export function validateFileManifest(
  files: Pick<BillFile, "size" | "contentType">[],
) {
  if (!files.length)
    throw new BillInputError(
      "Seleziona una bolletta o inserisci i dati a mano.",
    );
  const pdfs = files.filter((f) => f.contentType === "application/pdf");
  if (pdfs.length) {
    if (files.length !== 1 || files[0].size > BILL_LIMITS.pdfBytes)
      throw new BillInputError("Carica un solo PDF, fino a 10 MB e 20 pagine.");
  } else if (
    files.length > BILL_LIMITS.photos ||
    files.some(
      (f) =>
        !["image/jpeg", "image/png"].includes(f.contentType) ||
        f.size > BILL_LIMITS.photoBytes,
    ) ||
    files.reduce((sum, f) => sum + f.size, 0) > BILL_LIMITS.photoTotalBytes
  )
    throw new BillInputError(
      "Usa fino a 10 foto JPG/PNG: 10 MB ciascuna, 30 MB complessivi.",
    );
  if (files.some((f) => f.size <= 0))
    throw new BillInputError("Il file è vuoto.");
}
export async function inspectBillFile(
  bytes: Uint8Array,
  declared: Pick<BillFile, "contentType" | "size">,
) {
  if (bytes.byteLength !== declared.size)
    throw new BillInputError(
      "La dimensione del file non corrisponde all'upload.",
    );
  const isPdf = Buffer.from(bytes.subarray(0, 5)).toString() === "%PDF-";
  const isPng = Buffer.from(bytes.subarray(0, 8)).equals(
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  );
  const isJpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  const actual = isPdf
    ? "application/pdf"
    : isPng
      ? "image/png"
      : isJpeg
        ? "image/jpeg"
        : null;
  if (!actual || actual !== declared.contentType)
    throw new BillInputError(
      "Il contenuto del file non corrisponde al formato PDF/JPG/PNG dichiarato.",
    );
  validateFileManifest([declared]);
  let pages: number | undefined;
  if (isPng || isJpeg) {
    try {
      if (isPng) {
        if (bytes.length < 24) throw new Error("invalid_png");
        const view = new DataView(
          bytes.buffer,
          bytes.byteOffset,
          bytes.byteLength,
        );
        if (view.getUint32(16) * view.getUint32(20) > 100_000_000)
          throw new Error("image_too_large");
      }
      const document = await PDFDocument.create();
      const image = isPng
        ? await document.embedPng(bytes)
        : await document.embedJpg(bytes);
      if (
        image.width < 1 ||
        image.height < 1 ||
        image.width * image.height > 100_000_000
      )
        throw new Error("image_dimensions");
    } catch {
      throw new BillInputError(
        "L'immagine è danneggiata o troppo grande da decodificare. Usa un'altra foto o inserisci i dati a mano.",
      );
    }
  }

  if (isPdf) {
    try {
      const pdf = await PDFDocument.load(bytes);
      pages = pdf.getPageCount();
    } catch {
      throw new BillInputError(
        "Il PDF è protetto, corrotto o non leggibile: usa delle foto o inserisci i dati a mano.",
      );
    }
    if (pages < 1 || pages > BILL_LIMITS.pdfPages)
      throw new BillInputError(
        "Il PDF supera il limite di 20 pagine. Puoi inserire i dati a mano.",
      );
  }
  return {
    contentType: actual,
    pages,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
}
