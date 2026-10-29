import { expect, it } from "vitest";
import {
  bundledReferences,
  resolvePortalMunicipality,
} from "../../src/modules/references/registry";

it("resolves a legacy Portal locality without pretending it is a current ISTAT identity", () => {
  const refs = bundledReferences();
  const locality = resolvePortalMunicipality(refs, "024027", "electricity");
  expect(locality.status).toBe("ready");
  expect(locality.currentIstatCode).toBe("024129");
  expect(locality.territory?.regionCode).toBe("05");
  const gas = resolvePortalMunicipality(refs, "001272", "gas");
  expect(gas.status).toBe("ready");
  expect(gas.gas?.operationalProfile).toBe("C1 E");
});
