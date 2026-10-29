import type { AppDb } from "../db";
import { searchMunicipalities } from "../modules/comparison/municipalities";
import {
  lookupOfferArchive,
  OfferArchiveQuerySchema,
} from "../modules/comparison/offer-archive";
import { createComparisonService } from "../modules/comparison/service";

export type Operation =
  | "validate_profile"
  | "compare_offers"
  | "get_offer_detail"
  | "get_data_status";

/** One binding for both transports, including safe operational failures. */
export function createOperations(db: AppDb) {
  const service = createComparisonService({ db });
  return async (operation: Operation, input: unknown = {}): Promise<object> => {
    try {
      switch (operation) {
        case "validate_profile":
          return service.validateProfile(
            (input as { profile?: unknown } | null)?.profile,
          );
        case "compare_offers": {
          const body = input as {
            supplies?: unknown;
            profile?: unknown;
          } | null;
          if (body?.supplies !== undefined) {
            if (body.profile !== undefined)
              return {
                status: "needs_input",
                issues: [
                  {
                    path: "request",
                    message:
                      "Invia un profilo oppure l'elenco supplies, non entrambi.",
                  },
                ],
              };
            return await service.compareSupplies(body.supplies);
          }
          return await service.compare(input);
        }
        case "get_offer_detail":
          return await service.getOfferDetail(input);
        case "get_data_status": {
          const offerQuery = (input as { offerQuery?: unknown } | null)
            ?.offerQuery;
          if (offerQuery !== undefined) {
            const parsed = OfferArchiveQuerySchema.safeParse(offerQuery);
            if (!parsed.success)
              return {
                status: "needs_input",
                issues: parsed.error.issues.map((issue) => ({
                  path: `offerQuery.${issue.path.join(".")}`,
                  message: issue.message,
                })),
              };
            return await lookupOfferArchive(db, parsed.data);
          }
          const query = (input as { municipalityQuery?: unknown } | null)
            ?.municipalityQuery;
          return typeof query === "string"
            ? {
                schemaVersion: 1,
                municipalities: await searchMunicipalities(db, query),
              }
            : await service.getDataStatus();
        }
      }
    } catch {
      return {
        status: "temporarily_unavailable",
        reasons: ["comparison_service_unavailable"],
      };
    }
  };
}
