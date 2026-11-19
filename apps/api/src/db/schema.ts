import {
  type AnyPgColumn,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import { z } from "zod";
import { user } from "../auth/schema";
import type { captureFailuresSchema } from "../expenses/schema";

export const expenseCollectionTable = pgTable(
  "expense_collections",
  {
    id: uuid().primaryKey().defaultRandom().notNull(),
    userId: text()
      .notNull()
      .references(() => user.id),
    title: varchar({ length: 64 }).notNull(),
    color: varchar({ length: 7 }).notNull(),
  },
  (table) => [index("collections_user_idx").on(table.userId)],
);

export const collectionSchema = createSelectSchema(expenseCollectionTable).omit(
  { userId: true },
);
export const collectionsSchema = z.array(collectionSchema);
export const collectionIdSchema = collectionSchema.pick({ id: true });

export const collectionCreateSchema = createInsertSchema(
  expenseCollectionTable,
  {
    title: (schema) => schema.trim().min(1),
    color: (schema) => schema.regex(/^#[0-9a-fA-F]{6}$/),
  },
).omit({ id: true, userId: true });

export const collectionUpdateSchema = collectionCreateSchema
  .partial()
  .extend({ id: collectionIdSchema.shape.id })
  .refine((input) => input.title !== undefined || input.color !== undefined, {
    message: "Provide a title or color to update.",
  });

export const expensesTable = pgTable(
  "expenses",
  {
    id: uuid().primaryKey().defaultRandom().notNull(),
    userId: text()
      .notNull()
      .references(() => user.id),

    collectionId: uuid().references(() => expenseCollectionTable.id),

    title: varchar({ length: 64 }).notNull(),
    amountInCents: integer().notNull(),
    currency: varchar({ length: 3 }).notNull(),

    description: varchar({ length: 512 }).notNull(),
    merchant: varchar({ length: 255 }),

    category: varchar({ length: 255 }).notNull(),
    captureId: uuid().references((): AnyPgColumn => capturesTable.id),

    purchasedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("expenses_user_created_idx").on(table.userId, table.createdAt),
  ],
);

export const expenseSchema = createSelectSchema(expensesTable).omit({
  userId: true,
});
export const expensesSchema = z.array(expenseSchema);
export const expenseIdSchema = expenseSchema.pick({ id: true });

export const expenseCreateSchema = createInsertSchema(expensesTable, {
  title: (schema) => schema.trim().min(1),
  currency: z.enum(["NOK", "EUR", "USD"]),
}).omit({
  userId: true,
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const expenseUpdateSchema = expenseCreateSchema.partial().extend({
  id: expenseIdSchema.shape.id,
});

export const captureStatus = pgEnum("capture_status", [
  "extracting",
  "saving",
  "complete",
  "failed",
]);
export const captureStatusSchema = createSelectSchema(captureStatus);
export type CaptureStatus = z.infer<typeof captureStatusSchema>;

export const capturesTable = pgTable(
  "captures",
  {
    id: uuid().primaryKey().defaultRandom().notNull(),
    userId: text()
      .notNull()
      .references(() => user.id),
    status: captureStatus().notNull(),
    description: text().notNull(),
    fileNames: text().array().notNull(),
    failures: jsonb().$type<z.infer<typeof captureFailuresSchema>>(),
    errorMessage: text(),
    dismissedAt: timestamp({ withTimezone: true }),
  },
  (table) => [index("captures_user_status_idx").on(table.userId, table.status)],
);

export const captureSchema = createSelectSchema(capturesTable).omit({
  userId: true,
});
export const captureUpdateSchema = createUpdateSchema(capturesTable).omit({
  userId: true,
});

export type Capture = z.infer<typeof captureSchema>;
export type CaptureUpdate = z.infer<typeof captureUpdateSchema>;
