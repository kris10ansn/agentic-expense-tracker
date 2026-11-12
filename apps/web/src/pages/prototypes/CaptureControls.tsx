import {
  ArrowUp,
  Camera,
  ChevronDown,
  FolderOpen,
  Images,
  Mic,
} from "lucide-react";
import type { ComponentProps } from "react";
import { twMerge } from "tailwind-merge";
import { Button, IconButton, TextArea } from "../../components/inputs";
import type { Collection } from "../../lib/expenses";

// Capture controls are visual studies only. They never request device access or submit expenses.
export function RecordButton({ className }: { className?: string }) {
  return (
    <Button
      aria-label="Hold to record an expense"
      className={twMerge(
        "size-16 shrink-0 touch-manipulation rounded-full bg-blue-600 p-0 text-white select-none hover:bg-blue-700 focus-visible:outline-blue-600 active:bg-blue-800",
        className,
      )}
    >
      <Mic className="size-6" strokeWidth={1.7} />
    </Button>
  );
}

export function MediaButton({
  kind,
  stacked = false,
  className,
}: {
  kind: "camera" | "gallery";
  stacked?: boolean;
  className?: string;
}) {
  const Icon = kind === "camera" ? Camera : Images;
  return (
    <Button
      variant="ghost"
      aria-label={kind === "camera" ? "Take a photo" : "Choose from gallery"}
      className={twMerge(
        "gap-2 rounded-lg px-3 text-xs font-normal text-neutral-600 hover:bg-neutral-100",
        stacked && "min-w-16 flex-col gap-1 rounded-lg px-2 py-2",
        className,
      )}
    >
      <Icon className="size-5" strokeWidth={1.5} />
      {kind === "camera" ? "Camera" : "Gallery"}
    </Button>
  );
}

export function CaptureTextArea({
  className,
  ...props
}: ComponentProps<"textarea">) {
  return (
    <TextArea
      aria-label="Describe an expense"
      placeholder="Describe an expense…"
      rows={1}
      className={twMerge(
        "block max-h-32 min-h-11 w-full resize-none overflow-y-auto rounded-lg border-0 bg-transparent px-3 py-3 text-base leading-5 text-neutral-900 shadow-none placeholder:text-neutral-400 focus:ring-0 focus:outline-none focus-visible:outline-none lg:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export function SubmitDescriptionButton() {
  return (
    <IconButton
      aria-label="Add described expense"
      className="size-11 rounded-lg text-neutral-600 hover:bg-neutral-200"
    >
      <ArrowUp className="size-5" />
    </IconButton>
  );
}

export function CaptureCollection({
  collections,
  value,
  onChange,
}: {
  collections: Collection[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex min-h-11 w-fit max-w-full items-center gap-2 text-xs text-neutral-500">
      <FolderOpen className="size-4 shrink-0" strokeWidth={1.5} />
      <span className="hidden shrink-0 sm:inline">Add to</span>
      <span className="relative min-w-0">
        <select
          aria-label="New expense collection"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-11 max-w-full cursor-pointer appearance-none bg-transparent pr-5 text-sm font-medium text-neutral-800"
        >
          {collections.length === 0 && <option value="">No collections</option>}
          {collections.map((collection) => (
            <option key={collection.id} value={collection.id}>
              {collection.name}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-0 size-3.5 -translate-y-1/2" />
      </span>
    </label>
  );
}
