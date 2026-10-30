import { generateText } from "ai";
import { afterEach, expect, it, vi } from "vitest";
import { extractBill } from "../../src/modules/bill/provider";

vi.mock("ai", async (importOriginal) => ({
  ...(await importOriginal<typeof import("ai")>()),
  generateText: vi.fn(),
}));
afterEach(() => vi.unstubAllEnvs());

it("lets the AI SDK resolve deployed OIDC without requiring a local environment token", async () => {
  vi.stubEnv("VERCEL_OIDC_TOKEN", undefined);
  vi.stubEnv("AI_GATEWAY_API_KEY", undefined);
  const output = { readability: "unreadable", supplies: [] };
  vi.mocked(generateText).mockResolvedValue({ output } as Awaited<
    ReturnType<typeof generateText>
  >);
  const result = await extractBill(
    [
      {
        id: "synthetic",
        name: "synthetic.pdf",
        contentType: "application/pdf",
        bytes: new Uint8Array(),
      },
    ],
    new AbortController().signal,
  );
  expect(result.output).toEqual(output);
});
