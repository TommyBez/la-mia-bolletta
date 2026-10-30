import {
  createHash,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import { and, eq, gt, sql } from "drizzle-orm";
import { getDb } from "../../db";
import { billAttempts, billJobs } from "../../db/schema/documents";
import type { BillExtraction } from "./extraction";
import { type BillFile, BillInputError, validateFileManifest } from "./files";

const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export async function createBillJob(
  input: { name: string; size: number; contentType: string }[],
) {
  validateFileManifest(input);
  const id = randomUUID(),
    capability = randomBytes(32).toString("base64url");
  const files: BillFile[] = input.map((f) => {
    const fileId = randomUUID();
    const extension =
      f.contentType === "application/pdf"
        ? "pdf"
        : f.contentType === "image/png"
          ? "png"
          : "jpg";
    return {
      ...f,
      name: f.name.slice(0, 200),
      id: fileId,
      pathname: `bills/${id}/${fileId}.${extension}`,
    };
  });
  await getDb()
    .insert(billJobs)
    .values({
      id,
      capabilityHash: digest(capability),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      files,
    });
  return { id, capability, files };
}
export async function authorizedBillJob(id: string, capability: string | null) {
  if (!capability || !/^[-\w]{43}$/.test(capability))
    throw new BillInputError(
      "Il percorso è scaduto. Carica di nuovo la bolletta o inserisci i dati a mano.",
      "unauthorized",
    );
  const [job] = await getDb()
    .select()
    .from(billJobs)
    .where(eq(billJobs.id, id));
  if (
    !job ||
    job.expiresAt.getTime() < Date.now() ||
    !timingSafeEqual(
      Buffer.from(job.capabilityHash),
      Buffer.from(digest(capability)),
    )
  )
    throw new BillInputError(
      "Percorso non disponibile o scaduto.",
      "unauthorized",
    );
  return job;
}
export async function claimBillJob(id: string) {
  return getDb().transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(9009)`);
    const [job] = await tx.select().from(billJobs).where(eq(billJobs.id, id));
    if (job?.state === "complete")
      return { status: "complete" as const, result: job.result };
    if (job?.leaseUntil && job.leaseUntil > new Date())
      return { status: "busy" as const };
    const active = await tx
      .select({ id: billJobs.id })
      .from(billJobs)
      .where(
        and(eq(billJobs.state, "running"), gt(billJobs.leaseUntil, new Date())),
      );
    if (active.length >= 2) return { status: "capacity" as const };
    const leaseUntil = new Date(Date.now() + 240000);
    await tx
      .update(billJobs)
      .set({
        state: "running",
        leaseUntil,
        error: null,
      })
      .where(eq(billJobs.id, id));
    return { status: "claimed" as const, leaseUntil };
  });
}
export async function completeBillJob(
  id: string,
  result: BillExtraction,
  leaseUntil?: Date,
) {
  await getDb()
    .update(billJobs)
    .set({ state: "complete", result, leaseUntil: null, error: null })
    .where(
      leaseUntil
        ? and(eq(billJobs.id, id), eq(billJobs.leaseUntil, leaseUntil))
        : eq(billJobs.id, id),
    );
}
export async function failBillJob(
  id: string,
  error: string,
  leaseUntil?: Date,
) {
  await getDb()
    .update(billJobs)
    .set({ state: "failed", error, leaseUntil: null })
    .where(
      leaseUntil
        ? and(eq(billJobs.id, id), eq(billJobs.leaseUntil, leaseUntil))
        : eq(billJobs.id, id),
    );
}
export async function recordBillAttempt(
  input: typeof billAttempts.$inferInsert,
) {
  await getDb().insert(billAttempts).values(input);
}

export async function recordVerifiedBillFiles(
  id: string,
  files: BillFile[],
  leaseUntil: Date,
) {
  await getDb()
    .update(billJobs)
    .set({ files })
    .where(and(eq(billJobs.id, id), eq(billJobs.leaseUntil, leaseUntil)));
}
