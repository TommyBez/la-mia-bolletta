import { afterAll, afterEach, expect, it, vi } from "vitest";
import { createDb } from "../../src/db";
import { handleMcpRequest } from "../../src/transports/mcp";
import { handleWebRequest } from "../../src/transports/web";

if (!process.env.TEST_DATABASE_URL)
  throw new Error("Dedicated test database required");
const db = createDb(process.env.TEST_DATABASE_URL);
afterAll(() => db.$client.end());
afterEach(() => vi.unstubAllEnvs());

it("exposes only the four read-only operations, with no server OCR or import tools", async () => {
  vi.stubEnv("MCP_ACCESS_TOKEN", "test-only-mcp-access");
  const response = await handleMcpRequest(
    new Request("http://localhost/api/mcp", {
      method: "POST",
      headers: {
        authorization: "Bearer test-only-mcp-access",
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
    }),
    { db },
  );
  expect(response.status).toBe(200);
  const payload = await response.json();
  expect(
    payload.result.tools.map((tool: { name: string }) => tool.name).sort(),
  ).toEqual([
    "compare_offers",
    "get_data_status",
    "get_offer_detail",
    "validate_profile",
  ]);
  expect(
    payload.result.tools.every(
      (tool: { annotations: { readOnlyHint: boolean } }) =>
        tool.annotations.readOnlyHint,
    ),
  ).toBe(true);
});

it("returns exactly the same validation result through JSON and MCP", async () => {
  vi.stubEnv("MCP_ACCESS_TOKEN", "test-only-mcp-access");
  const input = {
    profile: {
      commodity: "gas",
      confirmed: false,
      annualConsumption: { value: "300", unit: "m3" },
    },
  };
  const web = await handleWebRequest(
    "validate_profile",
    new Request("http://localhost/api/profile/confirm", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    }),
    { db },
  );
  const mcp = await handleMcpRequest(
    new Request("http://localhost/api/mcp", {
      method: "POST",
      headers: {
        authorization: "Bearer test-only-mcp-access",
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: { name: "validate_profile", arguments: input },
      }),
    }),
    { db },
  );
  const expected = await web.json();
  expect(expected.status).toBe("needs_input");
  expect((await mcp.json()).result.structuredContent).toEqual(expected);
  expect(mcp.headers.get("mcp-session-id")).toBeNull();
});

it("rejects unauthenticated requests before revealing tools or data", async () => {
  vi.stubEnv("MCP_ACCESS_TOKEN", "test-only-mcp-access");
  const response = await handleMcpRequest(
    new Request("http://localhost/api/mcp", { method: "POST" }),
    { db },
  );
  expect(response.status).toBe(401);
  expect(await response.json()).toEqual({ error: "unauthorized" });
});
