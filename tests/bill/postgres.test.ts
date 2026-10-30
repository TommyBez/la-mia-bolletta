import { get } from "@vercel/blob";
import { PDFDocument } from "pdf-lib";
import { extractBill } from "../../src/modules/bill/provider";
import { runBillExtraction } from "../../src/modules/bill/service";
import { getBillUsage } from "../../src/modules/bill/usage";

vi.mock("@vercel/blob", () => ({ get: vi.fn() }));
vi.mock("../../src/modules/bill/provider", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../src/modules/bill/provider")>()),
  extractBill: vi.fn(),
}));

import { eq } from "drizzle-orm";
import { afterEach, beforeAll, expect, it, vi } from "vitest";
import { getDb } from "../../src/db";
import { migrateDatabase } from "../../src/db/migrate";
import { billAttempts, billJobs } from "../../src/db/schema/documents";
import {
  authorizedBillJob,
  claimBillJob,
  completeBillJob,
  createBillJob,
} from "../../src/modules/bill/repository";

const ids: string[] = [];
beforeAll(async () => {
  if (!process.env.TEST_DATABASE_URL)
    throw new Error("Real TEST_DATABASE_URL required");
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  await migrateDatabase(getDb());
});
afterEach(async () => {
  vi.useRealTimers();
  for (const id of ids) {
    await getDb().delete(billAttempts).where(eq(billAttempts.jobId, id));
    await getDb().delete(billJobs).where(eq(billJobs.id, id));
  }
  vi.clearAllMocks();
  ids.length = 0;
});
it("persists a private job and isolates capabilities, with a stable idempotent completed result", async () => {
  const job = await createBillJob([
    { name: "test-private.pdf", size: 123, contentType: "application/pdf" },
  ]);
  ids.push(job.id);
  expect(
    (await authorizedBillJob(job.id, job.capability)).files[0].pathname,
  ).toMatch(new RegExp(`^bills/${job.id}/`));
  await expect(authorizedBillJob(job.id, "x".repeat(43))).rejects.toThrow(
    "scaduto",
  );
  expect((await claimBillJob(job.id)).status).toBe("claimed");
  expect((await claimBillJob(job.id)).status).toBe("busy");
  const result = { readability: "unreadable" as const, supplies: [] };
  await completeBillJob(job.id, result);
  expect(await claimBillJob(job.id)).toMatchObject({
    status: "complete",
    result,
  });
});
it("allows only two simultaneous global OCR leases across independent paths", async () => {
  const jobs = await Promise.all(
    Array.from({ length: 3 }, () =>
      createBillJob([
        { name: "test.pdf", size: 123, contentType: "application/pdf" },
      ]),
    ),
  );
  ids.push(...jobs.map((j) => j.id));
  const claims = await Promise.all(jobs.map((j) => claimBillJob(j.id)));
  expect(claims.filter((c) => c.status === "claimed")).toHaveLength(2);
  expect(claims.filter((c) => c.status === "capacity")).toHaveLength(1);
});

it("does not let an expired execution overwrite the new lease", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  const job = await createBillJob([
    { name: "lease.pdf", size: 123, contentType: "application/pdf" },
  ]);
  ids.push(job.id);
  const claim = await claimBillJob(job.id);
  if (claim.status !== "claimed")
    throw new Error("capacity unexpectedly exhausted");
  vi.setSystemTime(new Date(claim.leaseUntil.valueOf() + 1));
  const replacement = await claimBillJob(job.id);
  expect(replacement.status).toBe("claimed");
  await completeBillJob(
    job.id,
    { readability: "unreadable", supplies: [] },
    claim.leaseUntil,
  );
  expect((await authorizedBillJob(job.id, job.capability)).state).toBe(
    "running",
  );
});

it("persists verified originals and attempt costs, retries one transient error and does not repeat a completed extraction", async () => {
  const pdf = await PDFDocument.create();
  pdf.addPage();
  const bytes = await pdf.save();
  const job = await createBillJob([
    {
      name: "test-synthetic.pdf",
      size: bytes.length,
      contentType: "application/pdf",
    },
  ]);
  ids.push(job.id);
  vi.mocked(get).mockImplementation(
    async () =>
      ({
        statusCode: 200,
        stream: new ReadableStream({
          start(c) {
            c.enqueue(bytes);
            c.close();
          },
        }),
        headers: new Headers(),
        blob: {
          size: bytes.length,
          contentType: "application/pdf",
          url: "https://synthetic.private.blob.vercel-storage.com/test.pdf",
          downloadUrl:
            "https://synthetic.private.blob.vercel-storage.com/test.pdf",
          pathname: job.files[0].pathname,
          contentDisposition: "attachment",
          cacheControl: "private",
          uploadedAt: new Date(),
          etag: "synthetic",
        },
      }) as Awaited<ReturnType<typeof get>>,
  );
  const result = { readability: "unreadable" as const, supplies: [] };
  vi.mocked(extractBill)
    .mockRejectedValueOnce(
      Object.assign(new Error("busy"), { statusCode: 429 }),
    )
    .mockResolvedValueOnce({
      output: result,
      usage: {
        inputTokens: 1000,
        outputTokens: 200,
        totalTokens: 1200,
        inputTokenDetails: {
          noCacheTokens: 1000,
          cacheReadTokens: 0,
          cacheWriteTokens: undefined,
        },
        outputTokenDetails: { textTokens: 200, reasoningTokens: 0 },
      },
      response: {
        id: "synthetic",
        timestamp: new Date(),
        modelId: "google/gemini-3.8-flash",
        messages: [],
      },
      providerMetadata: { gateway: { cost: "0.0015" } },
    } as Awaited<ReturnType<typeof extractBill>>);
  expect(await runBillExtraction(job.id, job.capability)).toMatchObject({
    status: "complete",
    result,
  });
  expect(await runBillExtraction(job.id, job.capability)).toMatchObject({
    status: "complete",
    result,
  });
  expect(extractBill).toHaveBeenCalledTimes(2);
  expect(get).toHaveBeenCalledTimes(1);
  const persisted = await authorizedBillJob(job.id, job.capability);
  expect(persisted.files[0].sha256).toMatch(/^[a-f0-9]{64}$/);
  expect(persisted.files[0].pages).toBe(1);
  const usage = await getBillUsage({
    from: new Date(Date.now() - 60000),
    to: new Date(Date.now() + 1000),
    jobId: job.id,
  });
  expect(usage.models).toMatchObject([
    {
      attempts: 2,
      completed: 1,
      failed: 1,
      gatewayReportedCostUsd: "0.0015",
      unknownCostAttempts: 1,
      inputTokens: 1000,
      outputTokens: 200,
    },
  ]);
});
