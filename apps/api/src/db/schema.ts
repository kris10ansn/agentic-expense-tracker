import {
  integer,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const expenseCollectionTable = pgTable("expense_collections", {
  id: uuid().primaryKey().defaultRandom().notNull(),
  title: varchar({ length: 64 }).notNull(),
  color: varchar({ length: 7 }).notNull(),
});

export const collectionSchema = createSelectSchema(expenseCollectionTable);
export const collectionsSchema = z.array(collectionSchema);
export const collectionIdSchema = collectionSchema.pick({ id: true });

export const collectionCreateSchema = createInsertSchema(
  expenseCollectionTable,
  {
    title: (schema) => schema.trim().min(1),
    color: (schema) => schema.regex(/^#[0-9a-fA-F]{6}$/),
  },
).omit({ id: true });

export const collectionUpdateSchema = collectionCreateSchema
  .partial()
  .extend({ id: collectionIdSchema.shape.id })
  .refine((input) => input.title !== undefined || input.color !== undefined, {
    message: "Provide a title or color to update.",
  });

export const expensesTable = pgTable("expenses", {
  id: uuid().primaryKey().defaultRandom().notNull(),

  collectionId: uuid().references(() => expenseCollectionTable.id),

  title: varchar({ length: 64 }).notNull(),
  amountInCents: integer().notNull(),
  currency: varchar({ length: 3 }).notNull(),

  description: varchar({ length: 512 }).notNull(),
  merchant: varchar({ length: 255 }),

  category: varchar({ length: 255 }).notNull(),

  purchasedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
});

export const expenseSchema = createSelectSchema(expensesTable);
export const expensesSchema = z.array(expenseSchema);
export const expenseIdSchema = expenseSchema.pick({ id: true });

export const expenseCreateSchema = createInsertSchema(expensesTable, {
  title: (schema) => schema.trim().min(1),
  currency: z.enum(["NOK", "EUR", "USD"]),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const expenseUpdateSchema = expenseCreateSchema.partial().extend({
  id: expenseIdSchema.shape.id,
});
