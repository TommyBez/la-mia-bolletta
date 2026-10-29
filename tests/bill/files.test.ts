import { PDFDocument } from "pdf-lib";
import { expect, it } from "vitest";
import {
  inspectBillFile,
  validateFileManifest,
} from "../../src/modules/bill/files";

it("checks actual PDF pages, bytes and signature", async () => {
  const pdf = await PDFDocument.create();
  pdf.addPage();
  const bytes = await pdf.save();
  expect(
    (
      await inspectBillFile(bytes, {
        size: bytes.length,
        contentType: "application/pdf",
      })
    ).pages,
  ).toBe(1);
  await expect(
    inspectBillFile(bytes, { size: bytes.length, contentType: "image/png" }),
  ).rejects.toThrow("formato");
});
it("rejects too many real pages without truncation", async () => {
  const pdf = await PDFDocument.create();
  for (let n = 0; n < 21; n++) pdf.addPage();
  const bytes = await pdf.save();
  await expect(
    inspectBillFile(bytes, {
      size: bytes.length,
      contentType: "application/pdf",
    }),
  ).rejects.toThrow("20 pagine");
});
it("enforces set limits and forbids PDF/photo mixing", () => {
  expect(() =>
    validateFileManifest([
      { size: 10, contentType: "application/pdf" },
      { size: 10, contentType: "image/png" },
    ]),
  ).toThrow();
  expect(() =>
    validateFileManifest(
      Array.from({ length: 4 }, () => ({
        size: 9 * 1024 * 1024,
        contentType: "image/png",
      })),
    ),
  ).toThrow("30 MB");
});

it("rejects a forged image containing only the magic bytes", async () => {
  const bytes = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]);
  await expect(
    inspectBillFile(bytes, { size: 8, contentType: "image/png" }),
  ).rejects.toThrow("immagine");
});
