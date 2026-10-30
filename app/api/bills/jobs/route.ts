import { z } from "zod";
import { billError, smallJson } from "@/src/modules/bill/http";
import { createBillJob } from "@/src/modules/bill/repository";

const schema = z.object({
  files: z
    .array(
      z.object({
        name: z.string().min(1).max(200),
        size: z.number().int().positive().max(10485760),
        contentType: z.enum(["application/pdf", "image/png", "image/jpeg"]),
      }),
    )
    .max(10),
});
export async function POST(request: Request) {
  try {
    const input = schema.safeParse(await smallJson(request));
    if (!input.success)
      return Response.json(
        {
          error: "invalid_document",
          message: "Seleziona un PDF o foto JPG/PNG entro i limiti indicati.",
        },
        { status: 422 },
      );
    return Response.json(await createBillJob(input.data.files), {
      status: 201,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return billError(error);
  }
}
