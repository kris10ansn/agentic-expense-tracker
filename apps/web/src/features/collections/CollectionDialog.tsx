import { Check } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Dialog, DialogActions } from "../../components/Dialog";
import { Button, FormField, TextInput } from "../../components/inputs";
import {
  type Collection,
  type CollectionInput,
  collectionColors,
} from "../../lib/expenses";

export function CollectionDialog({
  collection,
  onSave,
  onClose,
  pending,
  error,
}: {
  collection: Collection | null;
  onSave: (input: CollectionInput) => void;
  onClose: () => void;
  pending: boolean;
  error: string;
}) {
  const [color, setColor] = useState(collection?.color ?? "#458a72");
  const [validationError, setValidationError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const description = String(data.get("description") ?? "").trim();
    if (!name) {
      setValidationError("Give your collection a name.");
      return;
    }
    onSave({
      name,
      description,
      color,
    });
  }

  return (
    <Dialog
      title={collection ? "Edit collection" : "Create a collection"}
      description="Group related expenses together."
      onClose={onClose}
      pending={pending}
    >
      <form className="mt-6" onSubmit={handleSubmit} aria-busy={pending}>
        <fieldset disabled={pending} className="flex min-w-0 flex-col gap-5">
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
          {(validationError || error) && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
            >
              {validationError || error}
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
        </fieldset>
      </form>
    </Dialog>
  );
}
