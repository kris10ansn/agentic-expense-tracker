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
        "my-3 overflow-hidden rounded-lg border border-neutral-200 text-sm",
        className,
      )}
    >
      <div className="space-y-3 px-3.5 py-3">
        <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-500">
          <LoaderCircle
            aria-hidden="true"
            className="size-3.5 shrink-0 motion-safe:animate-spin"
            strokeWidth={1.75}
          />
          <span>Pending entry</span>
        </div>
        {files.length > 0 && (
          <ul className="space-y-3">
            {files.map((file) => (
              <CaptureFilePreview key={file.name} file={file} />
            ))}
          </ul>
        )}
        {description && (
          <p className="text-xs leading-relaxed text-pretty text-neutral-500">
            {description}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 border-t border-dashed border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-xs">
        <p className="font-medium text-neutral-500">{message}</p>
        <span className="ml-auto text-neutral-400">Not saved yet</span>
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
