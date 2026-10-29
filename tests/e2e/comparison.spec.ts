import { expect, type Page, test } from "@playwright/test";
import { PDFDocument, StandardFonts } from "pdf-lib";

test.beforeEach(async ({ page, baseURL }) => {
  const target = new URL(baseURL ?? "http://localhost:3100");
  if (!target.hostname.endsWith(".vercel.app")) return;
  if (!/^la-mia-bolletta(?:-[a-z0-9-]+)?\.vercel\.app$/.test(target.hostname))
    throw new Error("Only this project's protected preview is allowed");
  const token = process.env.VERCEL_OIDC_TOKEN;
  if (!token)
    throw new Error("Refresh the local Vercel OIDC token before testing");
  await page.route("**/*", (route) => {
    const headers = { ...route.request().headers() };
    if (new URL(route.request().url()).origin === target.origin)
      headers["x-vercel-trusted-oidc-idp-token"] = token;
    else delete headers["x-vercel-trusted-oidc-idp-token"];
    return route.continue({ headers });
  });
});

async function gasProfile(page: Page) {
  await page.goto("/confronto");
  await page.getByRole("button", { name: "Gas", exact: true }).click();
  await page.getByRole("button", { name: "Inserisco i dati a mano" }).click();
  await page
    .getByRole("checkbox", { name: /È una fornitura domestica/ })
    .check();
  await page
    .getByRole("combobox", { name: "Comune di fornitura" })
    .fill("Pescara");
  await page.getByRole("option", { name: "Pescara", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Consumo annuo (Smc)", exact: true })
    .fill("1200");
  await page.getByLabel("Questo consumo è").selectOption("declared");
  await page
    .locator('input[name="annualConsumption.period.from"]')
    .fill("2025-10-01");
  await page
    .locator('input[name="annualConsumption.period.to"]')
    .fill("2026-09-30");
  await page.getByLabel("Uso del gas").selectOption("heating");
  await page.getByRole("textbox", { name: "Classe del contatore" }).fill("G4");
  await page
    .getByRole("checkbox", { name: /Ho controllato questi dati/ })
    .check();
  await page
    .getByRole("button", { name: "Conferma i dati", exact: true })
    .click();
  await page
    .getByRole("checkbox", { name: "Domiciliazione bancaria", exact: true })
    .check();
}

test("manual gas profile reaches real advice, pinned ranking/detail and clears after reload", async ({
  page,
}) => {
  await gasProfile(page);
  const comparisonResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/comparison") &&
      response.request().method() === "POST",
  );
  await page
    .getByRole("button", { name: "Confronta le offerte reali" })
    .click();
  const result = await (await comparisonResponse).json();
  expect(result.status).toBe("ready");
  expect(result.coverage.source).toBe("official_portal");
  expect(result.coverage.complete).toBe(true);
  expect(result.recommendedOffer.savings).toBeUndefined();
  await expect(
    page.getByRole("heading", { name: "La tua prossima scelta, più chiara." }),
  ).toBeVisible();
  await expect(
    page.getByText("Prima i costi. Poi il risparmio.", { exact: true }),
  ).toBeVisible();
  const detailResponse = page.waitForResponse((response) =>
    response.url().endsWith("/api/offers/detail"),
  );
  await page.getByRole("button", { name: "Scopri questa offerta" }).click();
  const detail = await (await detailResponse).json();
  expect(detail.status).toBe("ready");
  expect(detail.versions).toEqual(result.versions);
  expect(detail.offer.annualCost).toBe(result.recommendedOffer.annualCost);
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByText(detail.offer.code, { exact: true }),
  ).toBeVisible();
  const exit = dialog.getByRole("link", { name: "Vai al fornitore" });
  if (detail.offer.officialUrl)
    expect(await exit.getAttribute("href")).toBe(detail.offer.officialUrl);
  await page.getByRole("button", { name: "Chiudi la scheda" }).click();
  await page.getByRole("button", { name: "Apri la classifica" }).click();
  await expect(
    page.getByRole("region", { name: "Classifica delle offerte" }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/comparison-desktop.png",
    fullPage: true,
  });
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Hai una bolletta a portata di mano?" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Apri la classifica" }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(() => ({
      local: localStorage.length,
      session: sessionStorage.length,
    })),
  ).toEqual({ local: 0, session: 0 });
});

test("electricity and gas keep independent results and only add compatible estimates", async ({
  page,
}) => {
  await gasProfile(page);
  await page
    .getByText("Il tuo contratto attuale e il risparmio", { exact: true })
    .click();
  await page
    .getByRole("checkbox", {
      name: "Inserisco o confermo le condizioni attuali",
    })
    .check();
  await page
    .getByLabel("Tipo di prezzo", { exact: true })
    .selectOption("fixed");
  await page.getByLabel(/Prezzo della sola energia/).fill("0");
  await page
    .getByLabel("Quota commerciale fissa (€/anno)", { exact: true })
    .fill("0");
  await page
    .getByLabel("Condizioni applicabili dal", { exact: true })
    .fill("2026-10-01");
  await page
    .getByLabel("Condizioni applicabili fino al", { exact: true })
    .fill("2027-09-30");
  await page
    .getByRole("checkbox", {
      name: /Confermo di aver riportato tutte le componenti/,
    })
    .check();
  const gasResponse = page.waitForResponse((r) =>
    r.url().endsWith("/api/comparison"),
  );
  await page
    .getByRole("button", { name: "Confronta le offerte reali" })
    .click();
  const gas = await (await gasResponse).json();
  expect(gas.status).toBe("ready");
  expect(gas.recommendation.kind).toBe("stay");
  await expect(
    page.getByRole("heading", {
      name: "A volte, la scelta migliore è restare.",
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Luce", exact: true }).click();
  const manual = page.getByRole("button", { name: "Inserisco i dati a mano" });
  if (await manual.isVisible()) await manual.click();
  await page
    .getByRole("checkbox", { name: /È una fornitura domestica/ })
    .check();
  await page
    .getByRole("combobox", { name: "Comune di fornitura" })
    .fill("Pescara");
  await page.getByRole("option", { name: "Pescara", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Consumo annuo (kWh)", exact: true })
    .fill("2700");
  await page.getByLabel("Questo consumo è").selectOption("declared");
  await page
    .locator('input[name="annualConsumption.period.from"]')
    .fill("2025-10-01");
  await page
    .locator('input[name="annualConsumption.period.to"]')
    .fill("2026-09-30");
  await page.getByRole("textbox", { name: "Potenza impegnata (kW)" }).fill("3");
  await page.getByLabel("Residenza anagrafica").selectOption("true");
  await page.getByRole("checkbox", { name: /Non conosco le fasce/ }).check();
  await page
    .getByRole("checkbox", { name: /Ho controllato questi dati/ })
    .check();
  await page
    .getByRole("button", { name: "Conferma i dati", exact: true })
    .click();
  await page
    .getByRole("checkbox", { name: "Domiciliazione bancaria", exact: true })
    .check();
  const electricityResponse = page.waitForResponse((r) =>
    r.url().endsWith("/api/comparison"),
  );
  await page
    .getByRole("button", { name: "Confronta le offerte reali" })
    .click();
  const electricity = await (await electricityResponse).json();
  expect(electricity.status).toBe("ready");
  expect(electricity.versions.references).toBe(gas.versions.references);
  await expect(page.getByText(/Luce \+ gas:/)).toBeVisible();
  await page.getByRole("button", { name: "Gas", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "A volte, la scelta migliore è restare.",
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Rivedi i dati" }).click();
  await page
    .getByRole("textbox", { name: "Consumo annuo (Smc)", exact: true })
    .fill("500");
  await page
    .getByRole("checkbox", { name: /Ho controllato questi dati/ })
    .check();
  await page
    .getByRole("button", { name: "Conferma i dati", exact: true })
    .click();
  await expect(page.getByText(/Luce \+ gas:/)).toHaveCount(0);
  await page.getByRole("button", { name: "Luce", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "La tua prossima scelta, più chiara." }),
  ).toBeVisible();
});

test("phone and keyboard can confirm data; changing a profile invalidates its result", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await gasProfile(page);
  await page
    .getByRole("button", { name: "Confronta le offerte reali" })
    .focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "La tua prossima scelta, più chiara." }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/comparison-phone-advice.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Rivedi i dati" }).click();
  await page
    .getByRole("textbox", { name: "Consumo annuo (Smc)", exact: true })
    .fill("500");
  await page
    .getByRole("checkbox", { name: /Ho controllato questi dati/ })
    .check();
  await page
    .getByRole("button", { name: "Conferma i dati", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "La tua prossima scelta, più chiara." }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Confronta le offerte reali" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/comparison-phone.png",
    fullPage: true,
  });
});

test("an archived offer supplies current conditions without client-supplied prices", async ({
  page,
}) => {
  await gasProfile(page);
  await page
    .getByText("Il tuo contratto attuale e il risparmio", { exact: true })
    .click();
  await page
    .getByRole("checkbox", {
      name: "Inserisco o confermo le condizioni attuali",
    })
    .check();
  await page
    .getByLabel("Come ricostruire il contratto attuale", { exact: true })
    .selectOption("archive");
  await page
    .getByLabel("Codice dell'offerta attuale", { exact: true })
    .fill("026846GSFML46XX297FIXWEBLEGGOL24");
  await page
    .getByRole("button", { name: "Cerca le condizioni archiviate" })
    .click();
  const options = page.getByRole("combobox", {
    name: "Condizioni ufficiali archiviate",
    exact: true,
  });
  await expect(options.locator("option")).not.toHaveCount(1);
  await options.selectOption({ index: 1 });
  await page
    .getByLabel("Condizioni applicabili dal", { exact: true })
    .fill("2026-10-01");
  await page
    .getByLabel("Condizioni applicabili fino al", { exact: true })
    .fill("2027-09-30");
  await page
    .getByRole("checkbox", { name: /Confermo che l'osservazione selezionata/ })
    .check();
  const response = page.waitForResponse((r) =>
    r.url().endsWith("/api/comparison"),
  );
  await page
    .getByRole("button", { name: "Confronta le offerte reali" })
    .click();
  const request = (await response).request().postDataJSON();
  expect(Object.keys(request.currentContract.offer).sort()).toEqual([
    "code",
    "supplierVat",
  ]);
  const result = await (await response).json();
  expect(result.status).toBe("ready");
  expect(result.currentContract.status).toBe("comparable");
  expect(result.currentContract.estimate.code).toBe(
    "026846GSFML46XX297FIXWEBLEGGOL24",
  );
});

test("editing a profile discards a real comparison whose response arrives late", async ({
  page,
  baseURL,
}) => {
  await gasProfile(page);
  const delivered = Promise.withResolvers<{ status: string }>();
  const release = Promise.withResolvers<void>();
  const finished = Promise.withResolvers<void>();
  const target = new URL(baseURL ?? "http://localhost:3100");
  await page.route("**/api/comparison", async (route) => {
    const headers = { ...route.request().headers() };
    if (
      target.hostname.endsWith(".vercel.app") &&
      process.env.VERCEL_OIDC_TOKEN
    )
      headers["x-vercel-trusted-oidc-idp-token"] =
        process.env.VERCEL_OIDC_TOKEN;
    const response = await route.fetch({ headers });
    delivered.resolve(await response.json());
    await release.promise;
    try {
      await route.fulfill({ response });
    } catch {
      /* The edited profile aborts the old browser request. */
    } finally {
      finished.resolve();
    }
  });
  await page
    .getByRole("button", { name: "Confronta le offerte reali" })
    .click();
  expect((await delivered.promise).status).toBe("ready");
  await page.getByRole("button", { name: "Rivedi i dati" }).click();
  await page
    .getByRole("textbox", { name: "Consumo annuo (Smc)", exact: true })
    .fill("500");
  await page
    .getByRole("checkbox", { name: /Ho controllato questi dati/ })
    .check();
  await page
    .getByRole("button", { name: "Conferma i dati", exact: true })
    .click();
  release.resolve();
  await finished.promise;
  await expect(
    page.getByRole("heading", { name: "La tua prossima scelta, più chiara." }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("region", { name: "Dati e preferenze del confronto" }),
  ).toContainText("500 Smc");
  await expect(
    page.getByRole("button", { name: "Confronta le offerte reali" }),
  ).toBeEnabled();
});

test("a synthetic bill crosses private upload and live Gateway before confirmed real advice", async ({
  page,
}) => {
  test.skip(
    process.env.LMB_LIVE_OCR_SMOKE !== "1",
    "Opt in to the live Gateway smoke; this does not qualify real bill accuracy",
  );
  test.setTimeout(240000);
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const sheet = pdf.addPage();
  const lines = [
    "BOLLETTA SINTETICA PER TEST - nessuna persona reale",
    "Fornitura domestica energia elettrica - Comune: Pescara",
    "Codice comune del Portale: 068028",
    "Consumo ANNUO: 3000 kWh dal 01/10/2025 al 30/09/2026",
    "Consumi ANNUALI F1: 1000 kWh; F2: 1000 kWh; F3: 1000 kWh",
    "Potenza impegnata: 3 kW. Cliente domestico residente: SI.",
    "Contratto attuale non disponibile: nessuna stima del risparmio.",
  ];
  lines.forEach((line, index) => {
    sheet.drawText(line, { font, size: 11, x: 35, y: 790 - index * 30 });
  });
  await page.goto("/confronto");
  const extractionResponse = page.waitForResponse(
    (response) =>
      /\/api\/bills\/[^/]+\/extract$/.test(new URL(response.url()).pathname),
    { timeout: 190000 },
  );
  await page.getByLabel("Carica bolletta", { exact: true }).setInputFiles({
    name: "synthetic-bill-no-personal-data.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from(await pdf.save()),
  });
  expect((await extractionResponse).status()).toBe(200);
  await expect(
    page.getByText("Ho preparato i dati della bolletta.", { exact: false }),
  ).toBeVisible({ timeout: 190000 });
  await expect(
    page.getByRole("textbox", { name: "Consumo annuo (kWh)", exact: true }),
  ).toHaveValue("3000");
  await expect(
    page.getByRole("checkbox", { name: /Ho controllato questi dati/ }),
  ).not.toBeChecked();
  await page
    .getByRole("checkbox", { name: /È una fornitura domestica/ })
    .check();
  await page
    .getByRole("combobox", { name: "Comune di fornitura" })
    .fill("Pescara");
  await page.getByRole("option", { name: "Pescara", exact: true }).click();
  await page.getByLabel("Questo consumo è").selectOption("measured");
  await page
    .locator('input[name="annualConsumption.period.from"]')
    .fill("2025-10-01");
  await page
    .locator('input[name="annualConsumption.period.to"]')
    .fill("2026-09-30");
  await page.getByRole("textbox", { name: "Potenza impegnata (kW)" }).fill("3");
  await page.getByLabel("Residenza anagrafica").selectOption("true");
  await page.getByRole("checkbox", { name: /Non conosco le fasce/ }).check();
  await page
    .getByRole("checkbox", { name: /Ho controllato questi dati/ })
    .check();
  await page
    .getByRole("button", { name: "Conferma i dati", exact: true })
    .click();
  await page
    .getByRole("checkbox", { name: "Domiciliazione bancaria", exact: true })
    .check();
  const response = page.waitForResponse((r) =>
    r.url().endsWith("/api/comparison"),
  );
  await page
    .getByRole("button", { name: "Confronta le offerte reali" })
    .click();
  const result = await (await response).json();
  expect(result.status).toBe("ready");
  expect(result.currentContract.status).toBe("absent");
  expect(result.recommendedOffer.savings).toBeUndefined();
  await expect(
    page.getByRole("heading", { name: "La tua prossima scelta, più chiara." }),
  ).toBeVisible();
});
