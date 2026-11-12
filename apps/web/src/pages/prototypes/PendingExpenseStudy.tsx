import { useState } from "react";
import { twMerge } from "tailwind-merge";
import { PendingExpenseRow, type PendingVariant } from "./PendingExpenseRow";
import {
  type PendingExpenseInput,
  pendingImageExamples,
  singlePhotoInput,
} from "./pending-expense-mocks";

// Local mock inputs for the three receipt layouts. No upload or AI request.
export function PendingExpenseStudy({ variant }: { variant: PendingVariant }) {
  const [input, setInput] = useState<PendingExpenseInput>(singlePhotoInput);

  return (
    <>
      <fieldset className="mb-3 flex gap-1 rounded-lg bg-neutral-100 p-1">
        <legend className="sr-only">Mock receipt input</legend>
        {pendingImageExamples.map((example) => (
          <button
            key={example.label}
            type="button"
            aria-pressed={input === example.input}
            onClick={() => setInput(example.input)}
            className={twMerge(
              "min-h-10 min-w-0 flex-1 cursor-pointer rounded-md px-1 text-xs font-medium text-neutral-500 transition-colors hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500",
              input === example.input && "bg-white text-neutral-900 shadow-sm",
            )}
          >
            {example.label}
          </button>
        ))}
      </fieldset>
      <PendingExpenseRow variant={variant} input={input} />
    </>
  );
}
