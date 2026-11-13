import {
  ArrowUp,
  Camera,
  ChevronDown,
  FolderOpen,
  Images,
  SquarePen,
} from "lucide-react";
import { useState } from "react";
import { twMerge } from "tailwind-merge";
import { Button, IconButton, TextArea } from "../../components/inputs";
import type { Collection } from "../../lib/expenses";
import { RecordingButton, type RecordingButtonProps } from "./RecordingButton";

type CaptureDockProps = {
  collections: Collection[];
  onManualEntry: (collectionId?: string) => void;
  onRecordingStart?: (collectionId: string) => void;
  onRecordingStop?: RecordingButtonProps["onRecordingStop"];
  onCamera?: (collectionId: string) => void;
  onGallery?: (collectionId: string) => void;
  onDescriptionSubmit?: (input: {
    description: string;
    collectionId: string;
  }) => void;
  className?: string;
};

function MediaButton({
  kind,
  onClick,
  disabled,
}: {
  kind: "camera" | "gallery";
  onClick: () => void;
  disabled: boolean;
}) {
  const Icon = kind === "camera" ? Camera : Images;
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      disabled={disabled}
      aria-label={kind === "camera" ? "Take a photo" : "Choose from gallery"}
      className="min-w-16 flex-col gap-1 rounded-lg px-2 py-2 text-xs font-normal text-neutral-600 hover:bg-neutral-100"
    >
      <Icon className="size-5" strokeWidth={1.5} />
      {kind === "camera" ? "Camera" : "Gallery"}
    </Button>
  );
}

export function CaptureDock({
  collections,
  onManualEntry,
  onRecordingStart,
  onRecordingStop,
  onCamera,
  onGallery,
  onDescriptionSubmit,
  className,
}: CaptureDockProps) {
  const [collectionId, setCollectionId] = useState("");
  const selectedCollection =
    collections.find((item) => item.id === collectionId)?.id ??
    collections[0]?.id ??
    "";

  return (
    <section
      aria-label="New expense"
      className={twMerge(
        "rounded-3xl border border-neutral-200/80 bg-white/95 px-4 pt-1 pb-4 shadow-lg shadow-neutral-900/10 backdrop-blur-md",
        className,
      )}
    >
      <div className="my-3 flex flex-wrap items-center justify-between gap-x-2">
        <CollectionSelector
          selectedCollection={selectedCollection}
          collections={collections}
          onChange={setCollectionId}
        />

        <Button
          aria-label="Add expense manually"
          onClick={() => onManualEntry(selectedCollection || undefined)}
          className="ml-auto shrink-0 gap-2 rounded-lg bg-blue-50 px-2 text-xs text-blue-700 hover:bg-blue-100"
        >
          <SquarePen className="size-4" />
          Manual
        </Button>
      </div>
      <DescriptionComposer
        disabled={!selectedCollection}
        onSubmit={(description) =>
          onDescriptionSubmit?.({
            description,
            collectionId: selectedCollection,
          })
        }
      />
      <div className="mt-4 flex items-center justify-evenly gap-3">
        <MediaButton
          kind="gallery"
          disabled={!selectedCollection}
          onClick={() => onGallery?.(selectedCollection)}
        />
        <RecordingButton
          disabled={!selectedCollection}
          onRecordingStart={() => onRecordingStart?.(selectedCollection)}
          onRecordingStop={(reason) => onRecordingStop?.(reason)}
        />
        <MediaButton
          kind="camera"
          disabled={!selectedCollection}
          onClick={() => onCamera?.(selectedCollection)}
        />
      </div>
    </section>
  );
}

function DescriptionComposer({
  onSubmit,
  disabled,
}: {
  onSubmit: (description: string) => void;
  disabled: boolean;
}) {
  const [text, setText] = useState("");
  const description = text.trim();
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!disabled && description) onSubmit(description);
      }}
      className="flex min-w-0 items-end rounded-xl border border-neutral-200 bg-neutral-50/50 focus-within:border-blue-500"
    >
      <TextArea
        aria-label="Describe an expense"
        placeholder="Describe…"
        value={text}
        onChange={(event) => setText(event.target.value)}
        className="block max-h-32 min-h-11 min-w-0 flex-1 resize-none overflow-y-auto rounded-lg border-0 bg-transparent px-3 py-3 text-base leading-5 text-neutral-900 shadow-none placeholder:text-neutral-400 focus:ring-0 focus:outline-none focus-visible:outline-none lg:text-sm"
      />
      <IconButton
        type="submit"
        aria-label="Add described expense"
        disabled={disabled || !description}
        className="size-11 rounded-lg text-neutral-600 hover:bg-neutral-200"
      >
        <ArrowUp className="size-5" />
      </IconButton>
    </form>
  );
}

const CollectionSelector = ({
  collections,
  selectedCollection,
  onChange,
}: {
  collections: Collection[];
  selectedCollection: string;
  onChange: (collectionId: string) => void;
}) => (
  <label className="flex min-h-11 w-fit max-w-full items-center gap-2 text-xs text-neutral-500">
    <FolderOpen className="size-4 shrink-0" strokeWidth={1.5} />
    <span className="hidden shrink-0 sm:inline">Add to</span>
    <span className="relative min-w-0">
      <select
        aria-label="New expense collection"
        value={selectedCollection}
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
