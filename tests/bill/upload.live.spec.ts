import { expect, test } from "@playwright/test";

test("private direct upload → Gemini Gateway → unconfirmed candidates", async ({
  page,
}) => {
  test.skip(
    process.env.LMB_LIVE_OCR_SMOKE !== "1",
    "Explicit opt-in required for paid live OCR smoke",
  );
  test.setTimeout(200000);
  await page.goto("http://localhost:3100/confronto");
  await page
    .getByLabel("Carica bolletta", { exact: true })
    .setInputFiles("/tmp/synthetic-lmb-bill.pdf");
  await expect(
    page.getByText("Ho preparato i dati della bolletta.", { exact: false }),
  ).toBeVisible({ timeout: 185000 });
  await expect(
    page.getByRole("textbox", { name: "Consumo annuo (kWh)", exact: true }),
  ).toHaveValue("3000");
  await expect(
    page.getByRole("checkbox", { name: /Ho controllato questi dati/ }),
  ).not.toBeChecked();
  await expect(
    page.getByText("Profilo luce confermato", { exact: true }),
  ).toHaveCount(0);
  await page.screenshot({
    path: "/tmp/lmb-upload-desktop.png",
    fullPage: true,
  });
});
