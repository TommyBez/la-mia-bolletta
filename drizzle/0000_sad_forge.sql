CREATE TABLE "lmb_catalog_files" (
	"id" text PRIMARY KEY NOT NULL,
	"run_id" text NOT NULL,
	"kind" text NOT NULL,
	"url" text NOT NULL,
	"source_date" text NOT NULL,
	"sha256" text NOT NULL,
	"blob_path" text NOT NULL,
	"acquired_at" timestamp with time zone NOT NULL,
	"size" integer NOT NULL,
	"etag" text
);
--> statement-breakpoint
CREATE TABLE "lmb_catalog_members" (
	"snapshot_id" text NOT NULL,
	"observation_id" text NOT NULL,
	CONSTRAINT "lmb_catalog_members_snapshot_id_observation_id_pk" PRIMARY KEY("snapshot_id","observation_id")
);
--> statement-breakpoint
CREATE TABLE "lmb_catalog_observations" (
	"id" text PRIMARY KEY NOT NULL,
	"commodity" text NOT NULL,
	"code" text NOT NULL,
	"supplier_vat" text NOT NULL,
	"economic_fingerprint" text NOT NULL,
	"content_hash" text NOT NULL,
	"data" jsonb NOT NULL,
	"first_observed_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lmb_catalog_published" (
	"commodity" text PRIMARY KEY NOT NULL,
	"snapshot_id" text NOT NULL,
	"published_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lmb_catalog_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"commodity" text NOT NULL,
	"state" text NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"finished_at" timestamp with time zone,
	"source_date" text,
	"snapshot_id" text,
	"error" jsonb
);
--> statement-breakpoint
CREATE TABLE "lmb_catalog_snapshots" (
	"id" text PRIMARY KEY NOT NULL,
	"commodity" text NOT NULL,
	"source_date" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"bundle_hash" text NOT NULL,
	"reference_version_id" text NOT NULL,
	"parameters" jsonb NOT NULL,
	"manifest" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lmb_reference_sets" (
	"id" text PRIMARY KEY NOT NULL,
	"source_date" text NOT NULL,
	"acquired_at" timestamp with time zone NOT NULL,
	"payload" jsonb NOT NULL,
	"coverage" jsonb NOT NULL,
	"manifest" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bill_attempts" (
	"id" text PRIMARY KEY NOT NULL,
	"job_id" text NOT NULL,
	"model" text NOT NULL,
	"prompt_version" text NOT NULL,
	"state" text NOT NULL,
	"input_tokens" integer,
	"output_tokens" integer,
	"estimated_cost_usd" text,
	"usage" jsonb,
	"duration_ms" integer NOT NULL,
	"error_code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bill_jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"capability_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"state" text DEFAULT 'uploading' NOT NULL,
	"files" jsonb NOT NULL,
	"result" jsonb,
	"error" text,
	"lease_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "published_scenarios" (
	"commodity" text PRIMARY KEY NOT NULL,
	"version_id" text NOT NULL,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scenario_snapshots" (
	"version_id" text PRIMARY KEY NOT NULL,
	"commodity" text NOT NULL,
	"acquisition_month" text NOT NULL,
	"acquired_at" timestamp with time zone NOT NULL,
	"coverage_start" text NOT NULL,
	"coverage_end" text NOT NULL,
	"snapshot" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lmb_catalog_files" ADD CONSTRAINT "lmb_catalog_files_run_id_lmb_catalog_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."lmb_catalog_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lmb_catalog_members" ADD CONSTRAINT "lmb_catalog_members_snapshot_id_lmb_catalog_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."lmb_catalog_snapshots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lmb_catalog_members" ADD CONSTRAINT "lmb_catalog_members_observation_id_lmb_catalog_observations_id_fk" FOREIGN KEY ("observation_id") REFERENCES "public"."lmb_catalog_observations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lmb_catalog_published" ADD CONSTRAINT "lmb_catalog_published_snapshot_id_lmb_catalog_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."lmb_catalog_snapshots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lmb_catalog_snapshots" ADD CONSTRAINT "lmb_catalog_snapshots_reference_version_id_lmb_reference_sets_id_fk" FOREIGN KEY ("reference_version_id") REFERENCES "public"."lmb_reference_sets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bill_attempts" ADD CONSTRAINT "bill_attempts_job_id_bill_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."bill_jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "published_scenarios" ADD CONSTRAINT "published_scenarios_version_id_scenario_snapshots_version_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."scenario_snapshots"("version_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "lmb_catalog_observation_content" ON "lmb_catalog_observations" USING btree ("commodity","supplier_vat","code","content_hash");--> statement-breakpoint
CREATE INDEX "bill_jobs_state_lease" ON "bill_jobs" USING btree ("state","lease_until");--> statement-breakpoint
CREATE INDEX "scenario_snapshot_commodity_month_idx" ON "scenario_snapshots" USING btree ("commodity","acquisition_month");