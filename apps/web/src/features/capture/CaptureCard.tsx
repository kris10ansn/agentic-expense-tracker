import { skipToken } from "@tanstack/react-query";
import { CircleAlert, CircleCheck, LoaderCircle, WifiOff } from "lucide-react";
import { useCallback } from "react";
import { twMerge } from "tailwind-merge";
import {
  type CaptureAttentionState,
  type CaptureCardState,
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

const cardContent = {
  sending: {
    title: "Pending entry",
    message: "Sending data...",
    icon: LoaderCircle,
  },
  connecting: {
    title: "Checking progress",
    message: "Connecting to progress updates...",
    icon: WifiOff,
  },
  extracting: {
    title: "Pending entry",
    message: "Running AI analysis...",
    icon: LoaderCircle,
  },
  saving: {
    title: "Pending entry",
    message: "Saving new expenses...",
    icon: LoaderCircle,
  },
  complete: {
    title: "Complete",
    message: "Processing complete.",
    icon: CircleCheck,
  },
  disconnected: {
    title: "Status unavailable",
    message:
      "Progress updates were interrupted. Your entry may still be processing or already saved.",
    icon: WifiOff,
  },
  failed: {
    title: "Capture failed",
    message: "Check your expenses before trying again.",
    icon: CircleAlert,
  },
  "needs-review": {
    title: "Needs review",
    message: "Some items could not be extracted. Review the details below.",
    icon: CircleAlert,
  },
} satisfies Record<
  CaptureCardState["kind"],
  { title: string; message: string; icon: typeof LoaderCircle }
>;

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
  const { title, message, icon: Icon } = cardContent[state.kind];
  const processing =
    state.kind === "sending" ||
    state.kind === "extracting" ||
    state.kind === "saving";

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={twMerge(
        "my-3 overflow-hidden rounded-lg border border-neutral-200 text-sm",
        className,
      )}
    >
      <div className="space-y-3 px-3.5 py-3">
        <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-500">
          <Icon
            aria-hidden="true"
            className={twMerge(
              "size-3.5 shrink-0",
              processing && "motion-safe:animate-spin",
            )}
            strokeWidth={1.75}
          />
          <span>{title}</span>
          {capture.kind === "notice" && (
            <button
              type="button"
              className="ml-auto rounded px-2 py-1 text-neutral-600 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2"
              onClick={() => onDismiss(capture.id)}
            >
              Dismiss
            </button>
          )}
        </div>
        {files.length > 0 && (
          <ul className="space-y-3">
            {files.map((file) => (
              <CaptureFilePreview key={file.name} file={file} />
            ))}
          </ul>
        )}
        {capture.description && (
          <p className="text-xs leading-relaxed text-pretty text-neutral-500">
            {capture.description}
          </p>
        )}
      </div>
      <div className="space-y-2 border-t border-dashed border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-xs">
        {state.kind === "failed" && (
          <p className="font-medium text-red-700">{state.message}</p>
        )}
        <p className="text-neutral-600">{message}</p>
        {state.kind === "needs-review" && (
          <ul className="space-y-2">
            {state.failures.map((failure, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: This fixed result list is never reordered.
              <li key={index}>
                <p className="font-medium text-neutral-700">
                  {failure.sourceText}
                </p>
                <p className="text-neutral-600">{failure.reason}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function CaptureFilePreview({ file }: { file: File }) {
  const imageRef = useCallback(
    (image: HTMLImageElement | null) => {
      if (!image) return;

      const url = URL.createObjectURL(file);
      image.src = url;
      return () => URL.revokeObjectURL(url);
    },
    [file],
  );

  return (
    <li className="flex min-w-0 items-center gap-2.5">
      <img
        ref={imageRef}
        key={file.name}
        alt={file.name}
        className="h-12 w-10 shrink-0 rounded-md border border-neutral-200 object-cover object-top"
      />
      <div className="min-w-0">
        <p
          title={file.name}
          className="truncate text-xs font-medium text-neutral-800"
        >
          {file.name}
        </p>
      </div>
    </li>
  );
}
