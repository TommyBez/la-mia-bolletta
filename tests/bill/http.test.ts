import { expect, it } from "vitest";
import { billError, smallJson } from "../../src/modules/bill/http";

it("caps streamed JSON before buffering an arbitrary request body", async () => {
  const request = new Request("http://localhost/api/bills/jobs", {
    method: "POST",
    body: "x".repeat(65537),
  });
  await expect(smallJson(request)).rejects.toThrow("grande");
});
it("reports malformed client JSON as a correctable request", async () => {
  let error: unknown;
  try {
    await smallJson(
      new Request("http://localhost", { method: "POST", body: "{" }),
    );
  } catch (caught) {
    error = caught;
  }
  expect(billError(error).status).toBe(422);
});
