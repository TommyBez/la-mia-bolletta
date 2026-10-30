import { z } from "zod";
import type { ConfirmedProfile, ProfileIssue } from "../../domain/profile";
import type { NormalizedOffer } from "../catalog/normalize";
import { normalizedOfferSchema } from "../catalog/normalize";
import type { CatalogRead } from "../catalog/service";
import type { ScenarioSnapshot } from "../scenario";

export const ComparisonPreferencesSchema = z
  .object({
    pricePreference: z.enum(["fixed", "any"]).default("any"),
    requirements: z
      .record(z.string(), z.enum(["satisfied", "not_satisfied", "unknown"]))
      .default({}),
  })
  .strict();
export type ComparisonPreferences = z.output<
  typeof ComparisonPreferencesSchema
>;

export type ComparisonVersions = {
  catalog: string;
  references: string;
  parameters: string;
  scenario: string;
  method: string;
};
export const ComparisonVersionsSchema = z
  .object({
    catalog: z.string().min(1).max(128),
    references: z.string().min(1).max(128),
    parameters: z.string().min(1).max(128),
    scenario: z.string().min(1).max(128),
    method: z.string().min(1).max(128),
  })
  .strict();

export type CostComponent = {
  code: string;
  label: string;
  amount: string;
  category: "sales" | "network" | "charges" | "excise" | "vat" | "discount";
};

export type Requirement = {
  code: string;
  label: string;
  answer: "satisfied" | "not_satisfied" | "unknown";
};

export type OfferEstimate = {
  offerId: string;
  code: string;
  supplierVat: string;
  name: string;
  supplierName: string;
  offerType: NormalizedOffer["offerType"];
  annualCost: string;
  monthlyAverage: string;
  breakdown: CostComponent[];
  eligibility: "eligible" | "conditional" | "ineligible";
  requirements: Requirement[];
  conditions: string[];
  assumptions: string[];
  validFrom: string;
  validTo: string;
  officialUrl?: string;
  savings?: string;
};

export type OfferCalculation =
  | { status: "calculated"; estimate: OfferEstimate }
  | { status: "incomplete_data"; reasons: string[]; offerCode: string }
  | { status: "ineligible"; reasons: string[]; offerCode: string };

const currentContractFields = {
  applicableFrom: z.iso.date(),
  applicableTo: z.iso.date(),
  confirmed: z.literal(true),
};
const confirmedBillContractSchema = z
  .object({
    ...currentContractFields,
    offer: normalizedOfferSchema,
    source: z
      .object({
        kind: z.literal("confirmed_bill"),
        reference: z.string().min(1).max(200),
      })
      .strict(),
  })
  .strict();
const officialArchiveContractSchema = z
  .object({
    ...currentContractFields,
    // Archived economics are resolved on the server; clients only identify them.
    offer: z.object({
      code: z.string().min(1),
      supplierVat: z.string().min(1),
    }),
    source: z
      .object({
        kind: z.literal("official_archive"),
        reference: z.string().min(1).max(200),
      })
      .strict(),
  })
  .strict();
const CurrentContractSchema = z.union([
  confirmedBillContractSchema,
  officialArchiveContractSchema,
]);
export type ConfirmedBillContractInput = z.output<
  typeof confirmedBillContractSchema
>;
export type CurrentContractInput = z.output<typeof CurrentContractSchema>;

export type CurrentContractResult =
  | { status: "absent" | "incomplete" | "outside_period"; reasons: string[] }
  | {
      status: "comparable";
      annualCost: string;
      estimate: OfferEstimate;
      reasons: [];
    };

export type ComparisonRequest = {
  profile: unknown;
  preferences?: z.input<typeof ComparisonPreferencesSchema>;
  currentContract?: CurrentContractInput;
  currentBillConditions?: unknown;
  versions?: ComparisonVersions;
  page?: { offset?: number; limit?: number };
};
export const ComparisonRequestSchema = z
  .object({
    profile: z.unknown(),
    currentBillConditions: z.unknown().optional(),
    preferences: ComparisonPreferencesSchema.optional(),
    versions: ComparisonVersionsSchema.optional(),
    page: z
      .object({
        offset: z.number().int().min(0).max(100_000).default(0),
        limit: z.number().int().min(1).max(50).default(20),
      })
      .strict()
      .optional(),
    currentContract: CurrentContractSchema.optional(),
  })
  .strict();
export const OfferDetailRequestSchema = ComparisonRequestSchema.extend({
  versions: ComparisonVersionsSchema,
  offerId: z.string().min(1).max(250),
});
export const ComparisonOperationSchema = ComparisonRequestSchema.extend({
  profile: z.unknown().optional(),
  supplies: z.array(ComparisonRequestSchema).min(1).max(2).optional(),
});

export type OfferDetailResult =
  | Exclude<ComparisonResult, { status: "ready" | "no_eligible_offers" }>
  | { status: "not_found"; reasons: string[] }
  | {
      status: "ready";
      offer: OfferEstimate;
      versions: ComparisonVersions;
      period: { from: string; to: string };
      profileHash: string;
      profileRevision: number;
    };

/** Both commodity engines receive the same pinned context and return the same DTO. */
export type OfferCalculationInput = {
  purpose?: "alternative" | "current";
  profile: ConfirmedProfile;
  preferences: ComparisonPreferences;
  offer: NormalizedOffer;
  catalog: CatalogRead;
  scenario: ScenarioSnapshot;
};

export type ComparisonResult =
  | { status: "needs_input"; issues: ProfileIssue[] }
  | {
      status: "incomplete_data" | "temporarily_unavailable";
      reasons: string[];
      profileRevision?: number;
    }
  | {
      status: "ready" | "no_eligible_offers";
      schemaVersion: 1;
      commodity: ConfirmedProfile["commodity"];
      profileRevision: number;
      profileHash: string;
      calculatedAt: string;
      validUntil: string;
      scenarioMonth: string;
      sourceDate: string;
      period: { from: string; to: string };
      versions: ComparisonVersions;
      coverage: {
        source: "official_portal";
        complete: true;
        considered: number;
        excluded: Record<string, number>;
      };
      offers: OfferEstimate[];
      conditionalOffers: OfferEstimate[];
      currentContract: CurrentContractResult;
      recommendation: {
        kind: "switch" | "stay" | "conditional" | "unavailable";
        offerId?: string;
        reasons: string[];
      };
      recommendedOffer?: OfferEstimate;
      pagination?: {
        offset: number;
        limit: number;
        eligibleTotal: number;
        conditionalTotal: number;
      };
      warnings: string[];
    };
