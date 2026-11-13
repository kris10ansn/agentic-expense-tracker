import { LoaderCircle } from "lucide-react";
import { twMerge } from "tailwind-merge";
import type { PendingCapture } from "./types";

export function PendingExpense({
  capture,
  className,
}: {
  capture: PendingCapture;
  className?: string;
}) {
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
          {/* <InputIcon aria-hidden="true" className="size-4" /> */}
          <span>Pending entry</span>
          <LoaderCircle
            aria-hidden="true"
            className="ml-auto size-4 shrink-0 text-blue-600 motion-safe:animate-spin"
            strokeWidth={1.75}
          />
        </div>
        {capture.description && (
          <p className="text-base text-pretty text-neutral-900">
            {capture.description}
          </p>
        )}
        {capture.images.length > 0 && <CompactImages images={capture.images} />}
      </div>
      <div className="flex items-center gap-2 border-t border-dashed border-neutral-200 bg-neutral-50 px-4 py-3">
        <p className="text-xs font-medium text-neutral-700">Waiting for AI</p>
        <span className="ml-auto text-xs text-neutral-500">Not saved yet</span>
      </div>
    </div>
  );
}

type ImageLayoutProps = { images: File[] };

function CompactImages({ images }: ImageLayoutProps) {
  return (
    <ul className="space-y-3">
      {images.map((image) => (
        <li key={image.name} className="flex min-w-0 items-center gap-3">
          <img
            src={URL.createObjectURL(image)}
            alt={image.name}
            className="size-14 shrink-0 rounded-lg border border-neutral-200 object-cover object-top"
          />
          <div className="min-w-0">
            <p title={image.name} className="truncate text-sm text-neutral-800">
              {image.name}
            </p>
            <p className="mt-1 text-xs text-neutral-500">Uploaded photo</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
