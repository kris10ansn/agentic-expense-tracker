CREATE TABLE "expense_collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(64) NOT NULL,
	"color" varchar(7) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "collectionId" uuid;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_collectionId_expense_collections_id_fk" FOREIGN KEY ("collectionId") REFERENCES "public"."expense_collections"("id") ON DELETE no action ON UPDATE no action;