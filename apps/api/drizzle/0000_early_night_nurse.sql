CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(64) NOT NULL,
	"amountInCents" integer NOT NULL,
	"currency" varchar(3) NOT NULL,
	"description" varchar(512) NOT NULL,
	"merchant" varchar(255),
	"category" varchar(255) NOT NULL,
	"purchasedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
