import { skipToken } from "@tanstack/react-query";
import { TriangleAlert } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { CaptureCardHeader } from "./CaptureCardHeader";
import { CaptureCardOutcome } from "./CaptureCardOutcome";
import { CaptureFilePreview } from "./CaptureFilePreview";
import {
  type CaptureAttentionState,
  useCaptureProgress,
} from "./useCaptureProgress";

export type CaptureCardData = {
  id: string;
  description: string;
} & (
  | { kind: "sending" | "processing" }
  | { kind: "notice"; state: CaptureAttentionState }
);

export type CaptureNotice = Extract<CaptureCardData, { kind: "notice" }>;

export function CaptureCard({
  capture,
  files,
  className,
  onAttention,
  onDismiss,
}: {
  capture: CaptureCardData;
  files: File[];
  className?: string;
  onAttention: (notice: CaptureNotice) => void;
  onDismiss: (id: string) => void;
}) {
  const progress = useCaptureProgress(
    capture.kind === "processing" ? capture.id : skipToken,
    (state) => {
      onAttention({
        id: capture.id,
        description: capture.description,
        kind: "notice",
        state,
      });
    },
  );
  const state = capture.kind === "notice" ? capture.state : progress;
  const reviewCount = state.kind === "needs-review" ? state.failures.length : 0;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={twMerge(
        "my-3 overflow-hidden rounded-lg border border-neutral-200 bg-white text-sm",
        className,
      )}
    >
      <div className="space-y-3 px-3.5 py-3">
        <CaptureCardHeader kind={state.kind} />
        {files.length > 0 && (
          <ul className="space-y-3">
            {files.map((file) => (
              <CaptureFilePreview key={file.name} file={file} />
            ))}
          </ul>
        )}
        {capture.description && (
          <p className="text-xs leading-relaxed text-pretty wrap-anywhere text-neutral-500">
            {capture.description}
          </p>
        )}
        {state.kind === "failed" && (
          <p className="text-xs leading-relaxed wrap-anywhere text-neutral-600">
            {state.message}
          </p>
        )}
        {state.kind === "needs-review" && (
          <p className="flex items-center gap-1.5 text-xs text-amber-700">
            <TriangleAlert aria-hidden="true" className="size-3.5 shrink-0" />
            {reviewCount} {reviewCount === 1 ? "needs" : "need"} review
          </p>
        )}
      </div>
      <CaptureCardOutcome
        state={state}
        onDismiss={
          capture.kind === "notice" ? () => onDismiss(capture.id) : undefined
        }
      />
    </div>
  );
}
