import { Images, LoaderCircle, MessageSquareText } from "lucide-react";
import { twMerge } from "tailwind-merge";
import {
  defaultPendingInput,
  type PendingExpenseImage,
  type PendingExpenseInput,
} from "./pending-expense-mocks";

export type PendingVariant = "receipt" | "preview" | "attachments";

export const pendingVariants: {
  id: PendingVariant;
  name: string;
  description: string;
}[] = [
  { id: "receipt", name: "Compact", description: "Thumbnail beside the file" },
  {
    id: "preview",
    name: "Image preview",
    description: "A closer look at the receipt",
  },
  {
    id: "attachments",
    name: "Photo strip",
    description: "Images side by side",
  },
];

type ImageLayoutProps = { images: readonly PendingExpenseImage[] };

function CompactImages({ images }: ImageLayoutProps) {
  return (
    <ul className="space-y-3">
      {images.map((image) => (
        <li key={image.id} className="flex min-w-0 items-center gap-3">
          <img
            src={image.src}
            alt={image.alt}
            className="size-14 shrink-0 rounded-lg border border-neutral-200 object-cover object-top"
          />
          <div className="min-w-0">
            <p title={image.name} className="truncate text-sm text-neutral-800">
              {image.name}
            </p>
            <p className="mt-1 text-xs text-neutral-500">Receipt photo</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function ImagePreviews({ images }: ImageLayoutProps) {
  return (
    <div className="space-y-4">
      {images.map((image) => (
        <figure key={image.id}>
          <img
            src={image.src}
            alt={image.alt}
            className="h-72 w-full rounded-lg border border-neutral-200 bg-neutral-100 object-contain"
          />
          <figcaption
            title={image.name}
            className="mt-2 truncate text-xs text-neutral-500"
          >
            {image.name}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

function AttachmentStrip({ images }: ImageLayoutProps) {
  return (
    <ul className="flex gap-3 overflow-x-auto pb-1">
      {images.map((image) => (
        <li key={image.id} className="w-24 shrink-0">
          <img
            src={image.src}
            alt={image.alt}
            className="h-28 w-full rounded-lg border border-neutral-200 object-cover object-top"
          />
          <p
            title={image.name}
            className="mt-2 truncate text-xs text-neutral-500"
          >
            {image.name}
          </p>
        </li>
      ))}
    </ul>
  );
}

const imageLayouts = {
  receipt: CompactImages,
  preview: ImagePreviews,
  attachments: AttachmentStrip,
} satisfies Record<PendingVariant, typeof CompactImages>;

// Visual mock input only. Pending entries never enter saved expense data.
export function PendingExpenseRow({
  variant = "receipt",
  input = defaultPendingInput,
  className,
}: {
  variant?: PendingVariant;
  input?: PendingExpenseInput;
  className?: string;
}) {
  const ImageLayout = imageLayouts[variant];
  const InputIcon = input.kind === "text" ? MessageSquareText : Images;
  const inputLabel =
    input.kind === "text"
      ? "Text entry"
      : input.description
        ? "Photo + note"
        : `${input.images.length} ${input.images.length === 1 ? "photo" : "photos"}`;

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
          <InputIcon aria-hidden="true" className="size-4" />
          <span>{inputLabel}</span>
          <LoaderCircle
            aria-hidden="true"
            className="ml-auto size-4 shrink-0 text-blue-600 motion-safe:animate-spin"
            strokeWidth={1.75}
          />
        </div>
        {input.description && (
          <p className="text-base text-pretty text-neutral-900">
            {input.description}
          </p>
        )}
        {input.kind === "images" && <ImageLayout images={input.images} />}
      </div>
      <div className="flex items-center gap-2 border-t border-dashed border-neutral-200 bg-neutral-50 px-4 py-3">
        <p className="text-xs font-medium text-neutral-700">Waiting for AI</p>
        <span className="ml-auto text-xs text-neutral-500">Not saved yet</span>
      </div>
    </div>
  );
}
