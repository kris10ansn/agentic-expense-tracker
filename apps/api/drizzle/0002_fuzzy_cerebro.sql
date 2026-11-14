CREATE TYPE "public"."capture_status" AS ENUM('extracting', 'saving', 'complete', 'failed');--> statement-breakpoint
CREATE TABLE "captures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"status" "capture_status" NOT NULL,
	"active" boolean NOT NULL,
	"description" text NOT NULL,
	"fileNames" text[] NOT NULL,
	"failures" jsonb
);
--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "captureId" uuid;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_captureId_captures_id_fk" FOREIGN KEY ("captureId") REFERENCES "public"."captures"("id") ON DELETE no action ON UPDATE no action;