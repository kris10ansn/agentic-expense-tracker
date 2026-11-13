import { Check, Trash2 } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Dialog, DialogActions } from "../../components/Dialog";
import { Button, FormField, Select, TextInput } from "../../components/inputs";
import {
  type Collection,
  categories,
  currencies,
  type Expense,
  type ExpenseInput,
  isKnownCategory,
  toDateInput,
} from "../../lib/expenses";
import { parseExpenseForm } from "./expense-form";

export function ExpenseDialog({
  expense,
  collections,
  defaultCollectionId,
  defaultDate,
  onSave,
  onDelete,
  onClose,
  pending,
  error,
}: {
  expense: Expense | null;
  collections: Collection[];
  defaultCollectionId: string;
  defaultDate: string;
  onSave: (input: ExpenseInput) => void;
  onDelete: (expense: Expense) => void;
  onClose: () => void;
  pending: boolean;
  error: string;
}) {
  const [validationError, setValidationError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = parseExpenseForm({
      data: new FormData(event.currentTarget),
      expense,
      collections,
    });
    if (!input) {
      setValidationError(
        "Enter a valid name, amount, currency, category, and date.",
      );
      return;
    }
    onSave(input);
  }

  return (
    <Dialog
      title={expense ? "Expense details" : "Add an expense"}
      description={
        expense ? "View or update this expense." : "Enter the details below."
      }
      onClose={onClose}
      pending={pending}
    >
      <form className="mt-6" onSubmit={handleSubmit} aria-busy={pending}>
        <fieldset disabled={pending} className="flex min-w-0 flex-col gap-5">
          <FormField htmlFor="expense-title" label="Expense name">
            <TextInput
              id="expense-title"
              name="title"
              placeholder="e.g. Coffee at Kaffebrenneriet"
              defaultValue={expense?.title ?? ""}
              maxLength={64}
              required
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField htmlFor="expense-amount" label="Amount">
              <TextInput
                id="expense-amount"
                name="amount"
                type="number"
                inputMode="decimal"
                placeholder="0.00"
                min="-21474836.48"
                max="21474836.47"
                step="0.01"
                defaultValue={expense ? expense.amountInCents / 100 : ""}
                required
              />
            </FormField>
            <FormField htmlFor="expense-date" label="Date">
              <TextInput
                id="expense-date"
                name="date"
                type="date"
                defaultValue={
                  expense ? toDateInput(expense.purchasedAt) : defaultDate
                }
                min="2000-01-01"
                max="2100-12-31"
                required
              />
            </FormField>
          </div>
          <FormField htmlFor="expense-currency" label="Currency">
            <Select
              id="expense-currency"
              name="currency"
              defaultValue={expense?.currency ?? "NOK"}
            >
              {Object.entries(currencies).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField htmlFor="expense-category" label="Category">
            <Select
              id="expense-category"
              name="category"
              defaultValue={expense?.category ?? "groceries"}
            >
              {expense && !isKnownCategory(expense.category) && (
                <option value={expense.category}>{expense.category}</option>
              )}
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
              defaultValue={
                expense ? (expense.collectionId ?? "") : defaultCollectionId
              }
            >
              <option value="">No collection</option>
              {collections.map((collection) => (
                <option key={collection.id} value={collection.id}>
                  {collection.title}
                </option>
              ))}
            </Select>
          </FormField>
          {(validationError || error) && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
            >
              {validationError || error}
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
        </fieldset>
      </form>
    </Dialog>
  );
}
