import { skipToken } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import { useCallback } from "react";
import { twMerge } from "tailwind-merge";
import { useCaptureProgress } from "./useCaptureProgress";

type PendingCaptureProps = {
  captureId: string | null;
  description: string;
  files: File[];
  className?: string;
};

export function PendingCapture({
  captureId,
  description,
  files,
  className,
}: PendingCaptureProps) {
  const message = useCaptureProgress(captureId ?? skipToken);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={twMerge(
        "my-3 overflow-hidden rounded-xl border border-neutral-200 text-sm",
        className,
      )}
    >
      <div className="space-y-4 px-4 py-4">
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <span>Pending entry</span>
          <LoaderCircle
            aria-hidden="true"
            className="ml-auto size-4 shrink-0 text-blue-600 motion-safe:animate-spin"
            strokeWidth={1.75}
          />
        </div>
        {description && (
          <p className="text-base text-pretty text-neutral-900">
            {description}
          </p>
        )}
        {files.length > 0 && (
          <ul className="space-y-3">
            {files.map((file) => (
              <CaptureFilePreview key={file.name} file={file} />
            ))}
          </ul>
        )}
      </div>
      <div className="flex items-center gap-2 border-t border-dashed border-neutral-200 bg-neutral-50 px-4 py-3">
        <p className="text-xs font-medium text-neutral-700">{message}</p>
        <span className="ml-auto text-xs text-neutral-500">Not saved yet</span>
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
    <li className="flex min-w-0 items-center gap-3">
      <img
        ref={imageRef}
        key={file.name}
        alt={file.name}
        className="size-14 min-h-14 min-w-14 shrink-0 rounded-lg border border-neutral-200 object-cover object-top"
      />
      <div className="min-w-0">
        <p title={file.name} className="truncate text-sm text-neutral-800">
          {file.name}
        </p>
        <p className="mt-1 text-xs text-neutral-500">Uploaded photo</p>
      </div>
    </li>
  );
}
