DROP INDEX "speed_reports_zip_idx";--> statement-breakpoint
ALTER TABLE "speed_reports" ALTER COLUMN "fingerprint" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "speed_reports" DROP COLUMN "zip";