import { expect, it } from "vitest";
import {
  bundledReferences,
  resolveMunicipality,
} from "../../src/modules/references/registry";

it("keeps current ISTAT and Portal identities separate and never guesses a merged locality", () => {
  const refs = bundledReferences();
  expect(refs.municipalities).toHaveLength(7894);
  expect(refs.portalMunicipalities).toHaveLength(7972);
  expect(resolveMunicipality(refs, "001272", "gas").status).toBe("ready");
  expect(resolveMunicipality(refs, "024129", "gas").status).toBe(
    "incomplete_data",
  );
  expect(resolveMunicipality(refs, "084020", "gas").status).toBe("unavailable");
  expect(refs.coverage.gasNationalReady).toBe(true);
  const partial = bundledReferences([]);
  expect(partial.coverage.gasNationalReady).toBe(false);
  expect(resolveMunicipality(partial, "001272", "gas").status).toBe(
    "incomplete_data",
  );
});
