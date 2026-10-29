CREATE TABLE "lmb_reference_published" (
	"scope" text PRIMARY KEY NOT NULL,
	"reference_version_id" text NOT NULL,
	"published_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lmb_reference_published" ADD CONSTRAINT "lmb_reference_published_reference_version_id_lmb_reference_sets_id_fk" FOREIGN KEY ("reference_version_id") REFERENCES "public"."lmb_reference_sets"("id") ON DELETE no action ON UPDATE no action;