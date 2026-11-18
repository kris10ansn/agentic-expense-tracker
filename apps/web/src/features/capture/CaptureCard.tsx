import { TriangleAlert } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { CaptureCardHeader } from "./CaptureCardHeader";
import { CaptureCardOutcome } from "./CaptureCardOutcome";
import { CaptureFilePreview } from "./CaptureFilePreview";
import { useDismissCapture } from "./mutations";
import { type Capture, useCaptureProgress } from "./useCaptureProgress";

export type CaptureCardData =
  | (Pick<Capture, "id" | "description" | "fileNames"> & { kind: "sending" })
  | (Capture & { kind: "persisted" });

export function CaptureCard({
  capture,
  files,
  className,
}: {
  capture: CaptureCardData;
  files: File[];
  className?: string;
}) {
  const state = useCaptureProgress(
    capture.kind === "persisted" ? capture : undefined,
  );
  const dismissal = useDismissCapture();
  const dismiss = () => dismissal.mutate(capture.id);
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
        {files.length === 0 && capture.fileNames.length > 0 && (
          <p className="text-xs wrap-anywhere text-neutral-600">
            {capture.fileNames.join(", ")}
          </p>
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
          state.kind === "failed" || state.kind === "needs-review"
            ? dismiss
            : undefined
        }
      />
    </div>
  );
}
