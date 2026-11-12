import { LoaderCircle, MessageSquareText } from "lucide-react";
import type { JSX } from "react";
import { twMerge } from "tailwind-merge";

export type PendingVariant = "quiet" | "progress" | "receipt";

export const pendingVariants: {
  id: PendingVariant;
  name: string;
  description: string;
}[] = [
  { id: "quiet", name: "Quiet row", description: "A place in the ledger" },
  {
    id: "progress",
    name: "Skeleton",
    description: "A preview of the new entry",
  },
  {
    id: "receipt",
    name: "Input receipt",
    description: "Your input, kept visible",
  },
];

const mockDescription = "Lunch at Godt Brød, 185 kr";

function WaitingIndicator() {
  return (
    <LoaderCircle
      aria-hidden="true"
      className="size-4 shrink-0 text-blue-600 motion-safe:animate-spin"
      strokeWidth={1.75}
    />
  );
}

function QuietPendingExpense() {
  return (
    <div className="flex items-center gap-3 border-b border-neutral-200 py-5">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-blue-50">
        <WaitingIndicator />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-neutral-900">Waiting for AI</p>
        <p className="mt-1 text-xs text-pretty text-neutral-500">
          {mockDescription}
        </p>
      </div>
      <span className="shrink-0 text-xs text-neutral-500">Not saved yet</span>
    </div>
  );
}

function ProgressPendingExpense() {
  return (
    <div className="my-3 border-l-2 border-blue-500 bg-neutral-50 px-4 py-4">
      <div className="flex items-center gap-2">
        <WaitingIndicator />
        <p className="font-medium text-neutral-900">Waiting for AI</p>
        <span className="ml-auto text-xs text-neutral-500">Not saved yet</span>
      </div>
      <p className="mt-3 text-sm text-neutral-600">{mockDescription}</p>
      <div
        aria-hidden="true"
        className="mt-5 flex items-start justify-between gap-6 motion-safe:animate-pulse"
      >
        <div className="flex flex-1 flex-col gap-2">
          <span className="h-2.5 w-2/3 rounded bg-neutral-200" />
          <span className="h-2 w-1/3 rounded bg-neutral-200/70" />
        </div>
        <span className="h-3 w-16 rounded bg-neutral-200" />
      </div>
    </div>
  );
}

function ReceiptPendingExpense() {
  return (
    <div className="my-3 overflow-hidden rounded-xl border border-neutral-200">
      <div className="px-4 py-4">
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <MessageSquareText aria-hidden="true" className="size-4" />
          <span>Text entry</span>
          <span className="ml-auto">Just added</span>
        </div>
        <p className="mt-4 text-base text-neutral-900">{mockDescription}</p>
      </div>
      <div className="flex items-center gap-2 border-t border-dashed border-neutral-200 bg-neutral-50 px-4 py-3">
        <WaitingIndicator />
        <p className="text-xs font-medium text-neutral-700">Waiting for AI</p>
        <span className="ml-auto text-xs text-neutral-500">Not saved yet</span>
      </div>
    </div>
  );
}

const pendingLayouts = {
  quiet: QuietPendingExpense,
  progress: ProgressPendingExpense,
  receipt: ReceiptPendingExpense,
} satisfies Record<PendingVariant, () => JSX.Element>;

// A visual placeholder only. It is never added to saved expense data or totals.
export function PendingExpenseRow({
  variant = "quiet",
  className,
}: {
  variant?: PendingVariant;
  className?: string;
}) {
  const PendingLayout = pendingLayouts[variant];

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={twMerge("text-sm", className)}
    >
      <PendingLayout />
    </div>
  );
}
