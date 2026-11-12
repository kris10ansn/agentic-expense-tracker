import { useState } from "react";
import { twMerge } from "tailwind-merge";
import { categories, formatAmount, formatDate } from "../../lib/expenses";
import {
  CaptureCollection,
  CaptureTextArea,
  MediaButton,
  RecordButton,
  SubmitDescriptionButton,
} from "./CaptureControls";
import { PendingExpenseRow } from "./PendingExpenseRow";
import type { PrototypeProps, Variant } from "./PrototypeControls";

type CaptureProps = {
  text: string;
  setText: (text: string) => void;
};

function RecentExpenses({
  workspace,
  className,
}: PrototypeProps & { className?: string }) {
  const recentExpenses = [...workspace.expenses]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 4);
  return (
    <section
      aria-label="Recent expenses"
      className={twMerge("min-h-0 overflow-y-auto", className)}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium">Recent expenses</h2>
        <button
          type="button"
          onClick={() => workspace.changeView("expenses")}
          className="min-h-11 cursor-pointer text-xs text-neutral-500 hover:text-neutral-900"
        >
          View all
        </button>
      </div>
      <ul className="divide-y divide-neutral-100">
        <li>
          <PendingExpenseRow />
        </li>
        {recentExpenses.map((expense) => (
          <li key={expense.id} className="flex items-center gap-4 py-4">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{expense.title}</p>
              <p className="mt-1 text-xs text-neutral-500">
                {categories[expense.category].label} ·{" "}
                {formatDate(expense.date)}
              </p>
            </div>
            <p className="shrink-0 text-sm tabular-nums">
              {formatAmount(expense.amount, 2)}{" "}
              <span className="text-xs text-neutral-400">kr</span>
            </p>
          </li>
        ))}
      </ul>
      {recentExpenses.length === 0 && (
        <p className="py-5 text-sm text-neutral-500">
          Your expenses will appear here.
        </p>
      )}
    </section>
  );
}

function DockCapture({ text, setText }: CaptureProps) {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-neutral-200 bg-neutral-50/50 focus-within:border-blue-500">
        <CaptureTextArea
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
        <div className="flex items-center gap-1 px-1 pb-1">
          <MediaButton kind="camera" />
          <MediaButton kind="gallery" />
          <div className="ml-auto">
            <SubmitDescriptionButton />
          </div>
        </div>
      </div>
      <RecordButton />
    </div>
  );
}

function VoiceCapture({ text, setText }: CaptureProps) {
  return (
    <div className="flex flex-col gap-5 lg:gap-8">
      <div className="flex items-end rounded-xl border border-neutral-200 bg-neutral-50/50 focus-within:border-blue-500">
        <CaptureTextArea
          value={text}
          onChange={(event) => setText(event.target.value)}
          className="min-w-0 flex-1"
        />
        <div className="p-1">
          <SubmitDescriptionButton />
        </div>
      </div>
      <div>
        <div className="flex items-center justify-evenly gap-3 py-1">
          <MediaButton kind="camera" stacked />
          <RecordButton
            round
            className="size-24 ring-8 ring-blue-50 lg:size-28"
          />
          <MediaButton kind="gallery" stacked />
        </div>
        <p className="mt-4 text-center text-xs font-medium text-neutral-700">
          Hold to record
        </p>
      </div>
    </div>
  );
}

function OneHandCapture({ text, setText }: CaptureProps) {
  return (
    <div className="flex items-end gap-3">
      <div className="min-w-0 flex-1 rounded-xl border border-neutral-200 bg-neutral-50/50 focus-within:border-blue-500">
        <div className="flex items-start">
          <CaptureTextArea
            value={text}
            onChange={(event) => setText(event.target.value)}
            className="h-28 min-w-0 flex-1 px-3"
          />
          <div className="pt-1">
            <SubmitDescriptionButton />
          </div>
        </div>
        <div className="flex items-center px-1 pb-1">
          <MediaButton kind="camera" className="flex-1 px-1" />
          <MediaButton kind="gallery" className="flex-1 px-1" />
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-center gap-2 pb-1">
        <RecordButton round className="size-20" />
        <p className="text-xs font-medium text-neutral-700">Hold to record</p>
      </div>
    </div>
  );
}

// Three visual capture placements inside the chosen inset workspace.
// Only the draft text and collection selection change; capture actions are inert.
export function HomeCapturePrototype({
  workspace,
  variant,
}: PrototypeProps & { variant: Variant }) {
  const [text, setText] = useState("");
  const [collectionId, setCollectionId] = useState("");
  const selectedCollection =
    workspace.collections.find((collection) => collection.id === collectionId)
      ?.id ??
    workspace.collections[0]?.id ??
    "";
  const captureProps = { text, setText };
  return (
    <>
      <div className="mb-5 shrink-0 lg:mb-10">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Log an expense
        </h1>
      </div>
      <div className="flex min-h-0 flex-1 flex-col lg:grid lg:grid-cols-2 lg:items-start lg:gap-12 xl:gap-20">
        <RecentExpenses
          workspace={workspace}
          className="flex-1 lg:order-last"
        />
        <section
          aria-label="New expense"
          className="shrink-0 bg-white pt-3 lg:pt-0"
        >
          <div className="mb-2">
            <CaptureCollection
              collections={workspace.collections}
              value={selectedCollection}
              onChange={setCollectionId}
            />
          </div>
          {variant === "dock" && <DockCapture {...captureProps} />}
          {variant === "voice" && <VoiceCapture {...captureProps} />}
          {variant === "one-hand" && <OneHandCapture {...captureProps} />}
        </section>
      </div>
    </>
  );
}
