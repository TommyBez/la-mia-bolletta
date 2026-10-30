import { readFileSync } from "node:fs";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createScenarioService,
  DOMESTIC_ANNUAL_REGULATED_PROFILES,
} from "../../src/modules/scenario";
import { gasSnapshot } from "./support";

const url = process.env.TEST_DATABASE_URL;
describe.skipIf(!url)("scenario PostgreSQL publication", () => {
  const pool = new Pool({ connectionString: url });
  const db = drizzle(pool);
  const service = createScenarioService(db, {
    now: () => new Date("2026-10-29T12:00:00Z"),
  });
  beforeAll(async () => {
    await pool.query(
      "DELETE FROM published_scenarios WHERE commodity='gas'; DELETE FROM scenario_snapshots WHERE commodity='gas'",
    );
  });
  afterAll(() => pool.end());
  it("imports the monthly operator artifact atomically, reads immutable versions, and preserves publication after invalid or old input", async () => {
    const original = gasSnapshot();
    const published = await service.importSnapshot(original);
    expect(published.status).toBe("published");
    if (published.status === "rejected")
      throw new Error(published.reasons.join(","));
    expect((await service.importSnapshot(original)).status).toBe("unchanged");
    const read = await service.getScenario({ commodity: "gas" });
    expect(read.status).toBe("ready");
    if (read.status !== "ready") throw new Error(read.reasons.join(","));
    expect(read.snapshot.coefficients[0].value).toBe(
      "0.8568583333333333333333333333",
    );
    const invalid = gasSnapshot();
    invalid.coefficients.pop();
    expect((await service.importSnapshot(invalid)).status).toBe("rejected");
    const next = gasSnapshot();
    next.acquiredAt = "2026-10-29T10:00:00Z";
    const updated = await service.importSnapshot(next);
    expect(updated.status).toBe("published");
    if (updated.status === "rejected")
      throw new Error(updated.reasons.join(","));
    expect((await service.importSnapshot(original)).status).toBe("rejected");
    expect((await service.getScenario({ commodity: "gas" })).versionId).toBe(
      updated.versionId,
    );
    expect(
      (
        await service.getScenario({
          commodity: "gas",
          versionId: published.versionId,
        })
      ).versionId,
    ).toBe(published.versionId);
    expect(
      (await service.getScenario({ commodity: "gas", versionId: "missing" }))
        .status,
    ).toBe("incomplete_data");
    expect(
      (
        await service.getScenario({
          commodity: "gas",
          at: new Date("2026-11-01T12:00:00Z"),
        })
      ).status,
    ).toBe("incomplete_data");
  });
  it("serializes competing publications; newest observed acquisition remains current", async () => {
    const a = gasSnapshot();
    a.acquiredAt = "2026-10-29T10:30:00Z";
    const b = gasSnapshot();
    b.acquiredAt = "2026-10-29T11:30:00Z";
    await Promise.all([service.importSnapshot(b), service.importSnapshot(a)]);
    const read = await service.getScenario({ commodity: "gas" });
    expect(read.status).toBe("ready");
    if (read.status === "ready")
      expect(read.snapshot.acquiredAt).toBe(b.acquiredAt);
  });
  it("refuses publication when the catalog binding changed before the atomic write", async () => {
    const input = gasSnapshot();
    input.acquiredAt = "2026-10-29T11:50:00Z";
    const result = await service.importSnapshot(input, {
      catalogVersionId: input.catalogVersionId,
    });
    expect(result.status).toBe("rejected");
    expect(result.reasons.join(" ")).toContain("catalog publication changed");
  });
  it("publishes all six live CCR profiles and blocks a PSV-only scenario when the gas catalog requires annual CCR", async () => {
    const currentService = createScenarioService(db, {
      now: () => new Date("2026-10-30T12:00:00Z"),
    });
    const requiredAnnualRegulatedProfiles = DOMESTIC_ANNUAL_REGULATED_PROFILES;
    expect(
      (
        await currentService.getScenario({
          commodity: "gas",
          requiredAnnualRegulatedProfiles,
        })
      ).status,
    ).toBe("incomplete_data");
    const candidate = JSON.parse(
      readFileSync(
        new URL("./fixtures/live-gas-ccr-20261030.json", import.meta.url),
        "utf8",
      ),
    );
    const result = await currentService.importSnapshot(candidate, {
      requiredAnnualRegulatedProfiles,
    });
    if (result.status === "rejected")
      throw new Error(result.reasons.join(", "));
    expect(result.status).toBe("published");
    const read = await currentService.getScenario({
      commodity: "gas",
      requiredAnnualRegulatedProfiles,
    });
    expect(read.status).toBe("ready");
    if (read.status === "ready")
      expect(read.snapshot.annualRegulatedRates).toHaveLength(6);
    candidate.annualRegulatedRates.pop();
    expect(
      (
        await currentService.importSnapshot(candidate, {
          requiredAnnualRegulatedProfiles,
        })
      ).status,
    ).toBe("rejected");
    expect(
      (
        await currentService.getScenario({
          commodity: "gas",
          requiredAnnualRegulatedProfiles,
        })
      ).versionId,
    ).toBe(read.versionId);
  });
});
