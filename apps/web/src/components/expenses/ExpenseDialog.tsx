import { Check, Trash2 } from "lucide-react";
import { type FormEvent, useState } from "react";
import {
  type Collection,
  categories,
  type Expense,
  isCategory,
} from "../../lib/expenses";
import { Button, FormField, Select, TextInput } from "../inputs";
import { Dialog, DialogActions } from "./Dialog";

export function ExpenseDialog({
  expense,
  collections,
  defaultCollectionId,
  defaultDate,
  onSave,
  onDelete,
  onClose,
}: {
  expense: Expense | null;
  collections: Collection[];
  defaultCollectionId: string;
  defaultDate: string;
  onSave: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
  onClose: () => void;
}) {
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const title = String(data.get("title") ?? "").trim();
    const amount = Number(data.get("amount"));
    const category = String(data.get("category"));
    const date = String(data.get("date"));
    const collectionId = String(data.get("collectionId"));
    if (
      !title ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      !isCategory(category) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !collections.some((item) => item.id === collectionId)
    ) {
      setError("Enter a name, a positive amount, a date, and a collection.");
      return;
    }
    onSave({
      id: expense?.id ?? crypto.randomUUID(),
      title,
      amount: Math.round(amount * 100) / 100,
      category,
      date,
      collectionId,
    });
  }

  return (
    <Dialog
      title={expense ? "Expense details" : "Add an expense"}
      description={
        expense ? "View or update this expense." : "Enter the details below."
      }
      onClose={onClose}
    >
      <form className="mt-6 flex flex-col gap-5" onSubmit={handleSubmit}>
        <FormField htmlFor="expense-title" label="Expense name">
          <TextInput
            id="expense-title"
            name="title"
            placeholder="e.g. Coffee at Kaffebrenneriet"
            defaultValue={expense?.title ?? ""}
            maxLength={100}
            required
          />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField htmlFor="expense-amount" label="Amount in NOK">
            <TextInput
              id="expense-amount"
              name="amount"
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              min="0.01"
              max="100000000"
              step="0.01"
              defaultValue={expense?.amount ?? ""}
              required
            />
          </FormField>
          <FormField htmlFor="expense-date" label="Date">
            <TextInput
              id="expense-date"
              name="date"
              type="date"
              defaultValue={expense?.date ?? defaultDate}
              min="2000-01-01"
              max="2100-12-31"
              required
            />
          </FormField>
        </div>
        <FormField htmlFor="expense-category" label="Category">
          <Select
            id="expense-category"
            name="category"
            defaultValue={expense?.category ?? "groceries"}
          >
            {Object.entries(categories).map(([id, item]) => (
              <option key={id} value={id}>
                {item.label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField
          htmlFor="expense-collectionId"
          label="Collection"
          hint="Keep related expenses together."
        >
          <Select
            id="expense-collectionId"
            name="collectionId"
            defaultValue={expense?.collectionId ?? defaultCollectionId}
            required
          >
            {collections.map((collection) => (
              <option key={collection.id} value={collection.id}>
                {collection.name}
              </option>
            ))}
          </Select>
        </FormField>
        {error && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}
        <DialogActions>
          {expense ? (
            <Button
              variant="ghost"
              className="text-red-700 hover:bg-red-50 hover:text-red-800"
              onClick={() => onDelete(expense)}
            >
              <Trash2 className="size-4" />
              Delete
            </Button>
          ) : (
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
          )}
          <Button type="submit">
            <Check className="size-4" />
            {expense ? "Save changes" : "Add expense"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
