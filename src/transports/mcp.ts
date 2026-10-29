import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";
import type { AppDb } from "../db";
import {
  ComparisonOperationSchema,
  OfferDetailRequestSchema,
} from "../modules/comparison/contracts";
import { OfferArchiveQuerySchema } from "../modules/comparison/offer-archive";
import { isMcpRequest } from "../server/internal-auth";
import { createOperations } from "./operations";

const annotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;
const toolResult = (value: object) => ({
  content: [{ type: "text" as const, text: JSON.stringify(value) }],
  structuredContent: value as Record<string, unknown>,
});

/** One transport per HTTP request: no saved user profile or MCP session. */
export async function handleMcpRequest(
  request: Request,
  { db }: { db: AppDb },
) {
  if (!isMcpRequest(request))
    return Response.json(
      { error: "unauthorized" },
      {
        status: 401,
        headers: { "WWW-Authenticate": "Bearer", "Cache-Control": "no-store" },
      },
    );
  if (request.method !== "POST")
    return Response.json(
      { error: "method_not_allowed" },
      { status: 405, headers: { Allow: "POST" } },
    );
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return Response.json({ error: "untrusted_origin" }, { status: 403 });
  const operate = createOperations(db);
  const server = new McpServer({ name: "la-mia-bolletta", version: "1.0.0" });
  server.registerTool(
    "validate_profile",
    {
      title: "Valida il profilo confermato",
      description:
        "Valida dati già estratti dal client, senza OCR server. Profilo schemaVersion 1: commodity electricity/gas, supplyContext domestic/active/switch_same_holder, municipality.portalCode, annualConsumption value/unit/period/kind, electricity powerKw/resident/bands oppure gas usage/meterClass, origin client_mcp, confirmed e revision. Non annualizza né converte m3 in Smc.",
      inputSchema: z.object({ profile: z.unknown() }),
      annotations,
    },
    async (input) => toolResult(await operate("validate_profile", input)),
  );
  server.registerTool(
    "compare_offers",
    {
      title: "Confronta le offerte reali",
      description:
        "Confronto stateless sul profilo confermato. Invia profile per una fornitura, oppure supplies con uno o due oggetti di confronto (luce/gas indipendenti e totale solo se compatibili). Costi EUR/anno su quattro trimestri; versioni e ipotesi incluse. Requisiti ignoti non sono consenso. Nessuna simulazione Portale viene avviata da questo tool.",
      inputSchema: ComparisonOperationSchema,
      annotations,
    },
    async (input) => toolResult(await operate("compare_offers", input)),
  );
  server.registerTool(
    "get_offer_detail",
    {
      title: "Leggi la scheda nel confronto",
      description:
        "Reinvia profilo, preferenze e tutte le versioni del risultato insieme all'offerId. Non cambia catalogo o scenario durante la consultazione.",
      inputSchema: OfferDetailRequestSchema,
      annotations,
    },
    async (input) => toolResult(await operate("get_offer_detail", input)),
  );
  server.registerTool(
    "get_data_status",
    {
      title: "Controlla fonti e copertura",
      description:
        "Stato separato di catalogo, riferimenti e scenario mensile per luce/gas; provenienza, date e copertura. Con offerQuery cerca codice offerta esatto e commodity nelle osservazioni ufficiali pubblicate, senza prezzi o originali privati. Con municipalityQuery cerca le identità ufficiali dei comuni per nome o codice, prima di confermare un profilo.",
      inputSchema: z.object({
        municipalityQuery: z.string().max(80).optional(),
        offerQuery: OfferArchiveQuerySchema.optional(),
      }),
      annotations,
    },
    async (input) => toolResult(await operate("get_data_status", input)),
  );
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
    maxRequestBodySize: 256 * 1024,
  });
  try {
    await server.connect(transport);
    const response = await transport.handleRequest(request);
    response.headers.set("Cache-Control", "no-store");
    return response;
  } finally {
    await server.close();
  }
}
