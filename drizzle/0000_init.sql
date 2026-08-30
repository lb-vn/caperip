CREATE TABLE "codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(16) NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"impressions" integer DEFAULT 0 NOT NULL,
	"claimed_count" integer DEFAULT 0 NOT NULL,
	"report_count" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"submitter_ip_hash" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"ip_hash" text NOT NULL,
	"action" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"code_id" integer NOT NULL,
	"ip_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "speed_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"zip" varchar(10) NOT NULL,
	"city" varchar(100) NOT NULL,
	"state" varchar(2) NOT NULL,
	"down_mbps" real NOT NULL,
	"up_mbps" real NOT NULL,
	"ping_ms" real NOT NULL,
	"time_bucket" text NOT NULL,
	"device" varchar(100),
	"source" varchar(50) DEFAULT 'cape.rip' NOT NULL,
	"lat" real,
	"lng" real,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"fingerprint" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_code_id_codes_id_fk" FOREIGN KEY ("code_id") REFERENCES "public"."codes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "codes_code_unique" ON "codes" USING btree ("code");--> statement-breakpoint
CREATE INDEX "codes_status_idx" ON "codes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "rate_events_lookup_idx" ON "rate_events" USING btree ("ip_hash","action","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "reports_code_ip_unique" ON "reports" USING btree ("code_id","ip_hash");--> statement-breakpoint
CREATE INDEX "speed_reports_zip_idx" ON "speed_reports" USING btree ("zip");--> statement-breakpoint
CREATE INDEX "speed_reports_city_state_idx" ON "speed_reports" USING btree ("city","state");--> statement-breakpoint
CREATE INDEX "speed_reports_status_idx" ON "speed_reports" USING btree ("status");