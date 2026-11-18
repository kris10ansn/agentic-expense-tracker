-- Earlier local capture work may already have these nullable columns.
ALTER TABLE "captures" ADD COLUMN IF NOT EXISTS "errorMessage" text;--> statement-breakpoint
ALTER TABLE "captures" ADD COLUMN IF NOT EXISTS "dismissedAt" timestamp with time zone;
