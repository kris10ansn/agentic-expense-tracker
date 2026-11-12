import { Check } from "lucide-react";
import { type FormEvent, useState } from "react";
import { type Collection, collectionColors } from "../../lib/expenses";
import { Button, FormField, TextInput } from "../inputs";
import { Dialog, DialogActions } from "./Dialog";

export function CollectionDialog({
  collection,
  showBudget = true,
  onSave,
  onClose,
}: {
  collection: Collection | null;
  showBudget?: boolean;
  onSave: (collection: Collection) => void;
  onClose: () => void;
}) {
  const [color, setColor] = useState(collection?.color ?? "#458a72");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const description = String(data.get("description") ?? "").trim();
    const budget = showBudget
      ? Number(data.get("budget"))
      : (collection?.budget ?? 0);
    if (!name || (showBudget && (!Number.isFinite(budget) || budget <= 0))) {
      setError(
        showBudget
          ? "Give your collection a name and a budget greater than zero."
          : "Give your collection a name.",
      );
      return;
    }
    onSave({
      id: collection?.id ?? crypto.randomUUID(),
      name,
      description,
      color,
      budget,
    });
  }

  return (
    <Dialog
      title={collection ? "Edit collection" : "Create a collection"}
      description="Group related expenses together."
      onClose={onClose}
    >
      <form className="mt-6 flex flex-col gap-5" onSubmit={handleSubmit}>
        <FormField htmlFor="collection-name" label="Collection name">
          <TextInput
            id="collection-name"
            name="name"
            defaultValue={collection?.name ?? ""}
            placeholder="e.g. A weekend away"
            maxLength={50}
            required
          />
        </FormField>
        <FormField
          htmlFor="collection-description"
          label="Description (optional)"
        >
          <TextInput
            id="collection-description"
            name="description"
            defaultValue={collection?.description ?? ""}
            placeholder="What are you keeping track of?"
            maxLength={120}
          />
        </FormField>
        {showBudget && (
          <FormField
            htmlFor="collection-budget"
            label="Monthly budget in NOK"
            hint="A simple limit to help you keep an eye on spending."
          >
            <TextInput
              id="collection-budget"
              name="budget"
              type="number"
              inputMode="numeric"
              min="1"
              max="100000000"
              step="1"
              defaultValue={collection?.budget ?? 5000}
              required
            />
          </FormField>
        )}
        <fieldset>
          <legend className="mb-3 text-sm font-medium text-slate-700">
            Collection color
          </legend>
          <div className="flex gap-3">
            {collectionColors.map((item) => (
              <label
                key={item.value}
                className="relative grid size-11 cursor-pointer place-items-center rounded-full border-4 border-white has-checked:outline has-checked:outline-slate-300 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-emerald-700"
                style={{ backgroundColor: item.value }}
              >
                <input
                  className="absolute inset-0 size-full cursor-pointer opacity-0"
                  type="radio"
                  name="color"
                  value={item.value}
                  checked={color === item.value}
                  onChange={() => setColor(item.value)}
                  aria-label={item.label}
                />
                {color === item.value && (
                  <Check
                    className="pointer-events-none size-5 text-white"
                    aria-hidden="true"
                  />
                )}
              </label>
            ))}
          </div>
        </fieldset>
        {error && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}
        <DialogActions>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            <Check className="size-4" />
            {collection ? "Save changes" : "Create collection"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
