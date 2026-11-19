import { ChevronRight, ChevronUp, Info, TriangleAlert } from "lucide-react";
import { useId, useState } from "react";
import { twMerge } from "tailwind-merge";
import { CaptureSourceImages } from "./CaptureSourceImages";
import type { CaptureCardState } from "./useCaptureProgress";

const messages = {
  sending: "Sending data...",
  connecting: "Connecting to progress updates...",
  extracting: "Running AI analysis...",
  saving: "Saving new expenses...",
  complete: "Processing complete.",
  disconnected:
    "Progress updates were interrupted. Your entry may still be processing or already saved.",
  failed: "Check your expenses before trying again.",
} satisfies Record<Exclude<CaptureCardState["kind"], "needs-review">, string>;

export function CaptureCardOutcome({
  state,
  fileNames,
  files,
  onDismiss,
}: {
  state: CaptureCardState;
  fileNames: string[];
  files: File[];
  onDismiss: (() => void) | undefined;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const detailsId = useId();
  const reviewCount = state.kind === "needs-review" ? state.failures.length : 0;
  const reviewItemLabel = reviewCount === 1 ? "item" : "items";
  const DetailsIcon = detailsOpen ? ChevronUp : ChevronRight;

  return (
    <>
      {state.kind === "needs-review" && (
        <ul
          id={detailsId}
          hidden={!detailsOpen}
          aria-label="Items needing review"
          className="divide-y divide-neutral-100 border-t border-neutral-100 px-3.5"
        >
          {state.failures.map((failure, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: This fixed result list is never reordered.
            <li key={index} className="flex gap-2.5 py-3 text-xs">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-amber-50 text-amber-700">
                <TriangleAlert aria-hidden="true" className="size-3.5" />
              </span>
              <div className="min-w-0 flex-1 wrap-anywhere">
                <p className="font-medium text-neutral-800">
                  {failure.partialExpense.title || "Unsaved expense"}
                </p>
                <p className="mt-1 leading-relaxed text-amber-800">
                  {failure.reason}
                </p>
                {failure.sourceText && (
                  <blockquote className="mt-2 border-l-2 border-neutral-200 bg-neutral-50 px-2.5 py-2 leading-relaxed text-neutral-500">
                    {failure.sourceText}
                  </blockquote>
                )}
                <CaptureSourceImages
                  sourceImageIds={failure.sourceImageIds}
                  fileNames={fileNames}
                  files={files}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
      <div
        className={twMerge(
          "flex flex-wrap items-center gap-2 border-t border-dashed border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-xs text-neutral-600",
          state.kind === "failed" &&
            "border-solid border-red-100 bg-red-50/60 text-red-800",
          state.kind === "needs-review" &&
            "border-solid border-amber-100 bg-amber-50/60 text-amber-800",
        )}
      >
        {state.kind === "needs-review" ? (
          <p className="flex items-center gap-1.5">
            <Info aria-hidden="true" className="size-3.5 shrink-0" />
            {reviewCount} {reviewItemLabel} not saved
          </p>
        ) : (
          <p className="flex flex-1 items-start gap-1.5">
            {state.kind === "failed" && (
              <Info aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
            )}
            {messages[state.kind]}
          </p>
        )}
        {onDismiss && (
          <div className="ml-auto flex items-center gap-1.5">
            <button
              type="button"
              className="rounded px-2 py-1.5 text-neutral-500 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2"
              onClick={onDismiss}
            >
              Dismiss
            </button>
            {state.kind === "needs-review" && (
              <button
                type="button"
                aria-expanded={detailsOpen}
                aria-controls={detailsId}
                className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-2.5 py-1.5 font-medium text-neutral-700 hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2"
                onClick={() => setDetailsOpen((open) => !open)}
              >
                {detailsOpen
                  ? "Hide details"
                  : `Review ${reviewCount} ${reviewItemLabel}`}
                <DetailsIcon aria-hidden="true" className="size-3 shrink-0" />
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
