import { validateProfile } from "@/src/domain/profile";
import { smallJson } from "@/src/modules/bill/http";
export async function POST(request: Request) {
  try {
    const result = validateProfile(await smallJson(request));
    return Response.json(result, {
      status: result.status === "ready" ? 200 : 422,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json(
      {
        status: "needs_input",
        issues: [{ path: "", message: "Controlla i dati inseriti." }],
      },
      { status: 400 },
    );
  }
}
