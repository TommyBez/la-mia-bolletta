import { timingSafeEqual } from "node:crypto";

/** Internal import endpoints fail closed when no operator secret is configured. */
export function isInternalRequest(request: Request): boolean {
  return matchesBearer(request, process.env.CRON_SECRET);
}

export function isMcpRequest(request: Request): boolean {
  return matchesBearer(request, process.env.MCP_ACCESS_TOKEN);
}

function matchesBearer(request: Request, secret: string | undefined): boolean {
  if (!secret) return false;
  const actual = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
