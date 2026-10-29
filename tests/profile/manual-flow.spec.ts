import { expect, test } from "@playwright/test";

test("manual gas profile confirms, keeps electricity separate and disappears on reload", async ({
  page,
}) => {
  await page.goto("http://localhost:3100/confronto");
  await page.getByRole("button", { name: "Gas", exact: true }).click();
  await page.getByRole("button", { name: "Inserisco i dati a mano" }).click();
  await page
    .getByRole("checkbox", { name: /È una fornitura domestica/ })
    .check();
  await page
    .getByRole("textbox", { name: "Comune di fornitura" })
    .fill("Pescara");
  await page
    .getByRole("textbox", { name: "Codice ISTAT del comune" })
    .fill("068028");
  await page
    .getByRole("textbox", { name: "Consumo annuo (Smc)", exact: true })
    .fill("1000");
  await page.getByLabel("Questo consumo è").selectOption("declared");
  await page.getByLabel("Inizio periodo annuale").fill("2025-10-01");
  await page.getByLabel("Fine periodo annuale").fill("2026-09-30");
  await page.getByLabel("Uso del gas").selectOption("heating");
  await page.getByRole("textbox", { name: "Classe del contatore" }).fill("G4");
  await page
    .getByRole("checkbox", { name: /Ho controllato questi dati/ })
    .check();
  await page.getByRole("button", { name: "Conferma i dati" }).click();
  await expect(
    page.getByText("Profilo gas confermato", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Luce", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Consumo annuo (kWh)", exact: true }),
  ).toHaveValue("");
  await page.getByRole("button", { name: "Gas", exact: true }).click();
  await expect(
    page.getByText("Profilo gas confermato", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Profilo gas confermato", { exact: true }),
  ).toHaveCount(0);
});
