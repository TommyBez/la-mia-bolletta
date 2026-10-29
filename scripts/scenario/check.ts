import { readFile } from "node:fs/promises";
import { qualifyScenario } from "../../src/modules/scenario";

async function main() {
  const r = qualifyScenario(
    JSON.parse(await readFile(process.argv[2], "utf8")),
  );
  console.log(
    JSON.stringify(
      r.status === "qualified"
        ? {
            status: r.status,
            versionId: r.versionId,
            coefficientCount: r.snapshot.coefficients.length,
            annualCount: r.snapshot.annualSales.length,
          }
        : r,
      null,
      2,
    ),
  );
  if (r.status === "rejected") process.exitCode = 1;
}
main().catch(() => {
  console.error("Scenario validation failed");
  process.exitCode = 1;
});
