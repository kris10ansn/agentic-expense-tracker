import { useQuery } from "@tanstack/react-query";
import {
  ArrowUp,
  Camera,
  ChevronDown,
  FolderOpen,
  Images,
  SquarePlus,
} from "lucide-react";
import { useCallback, useState } from "react";
import { twMerge } from "tailwind-merge";
import { ImagePreview } from "../../components/ImagePreview";
import {
  Button,
  FileInputButton,
  type FileInputButtonProps,
  IconButton,
  TextArea,
} from "../../components/inputs";
import { QueryError } from "../../components/QueryError";
import { createTranscript, useSpeech } from "../../hooks/useSpeech";
import type { Collection } from "../../lib/expenses";
import { trpc } from "../../trpc";
import { CollectionSelectSkeleton } from "../collections/CollectionSkeletons";
import { RecordingButton } from "./RecordingButton";

export type CaptureDockData = {
  collectionId: string;
  description: string;
  files: File[];
};

type CaptureDockProps = {
  onManualEntry: (collectionId?: string) => void;
  onSubmit: (input: CaptureDockData) => void;
  className?: string;
};

export function CaptureDock({
  className,
  onSubmit,
  onManualEntry,
}: CaptureDockProps) {
  const collectionsQuery = useQuery(trpc.collections.list.queryOptions());
  const collections = collectionsQuery.data;

  const [collectionId, setCollectionId] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([] as File[]);

  const selectedCollection =
    collections?.find((item) => item.id === collectionId)?.id ??
    collections?.[0]?.id ??
    "";

  const collectionError = collectionsQuery.isError ? (
    <QueryError
      message={
        collections
          ? "Unable to refresh collections. Showing previous data."
          : "Unable to load collections."
      }
      onRetry={() => void collectionsQuery.refetch()}
      retrying={collectionsQuery.isFetching}
    />
  ) : null;

  const handleSpeechResults = useCallback(
    (results: SpeechRecognitionResultList) => {
      setDescription(createTranscript(results));
    },
    [],
  );

  const speech = useSpeech({ onResults: handleSpeechResults });

  const handleRecordingStart = useCallback(
    () => speech.startRecording?.(),
    [speech.startRecording],
  );
  const handleRecordingStop = useCallback(
    () => speech.stopRecording?.(),
    [speech.stopRecording],
  );

  const handleFileChange = useCallback(
    (list: FileList) => setFiles([...files, ...list]),
    [files],
  );

  const handleRemoveFile = useCallback(
    (file: File) => setFiles(files.filter((f) => f !== file)),
    [files],
  );

  const submit = useCallback(() => {
    onSubmit({ collectionId: selectedCollection, description, files });

    setDescription("");
    setFiles([]);
  }, [onSubmit, files, description, selectedCollection]);

  return (
    <section
      aria-label="New expense"
      className={twMerge(
        "rounded-3xl border border-neutral-200/80 bg-white/95 px-4 pt-1 pb-4 shadow-lg shadow-neutral-900/10 backdrop-blur-md",
        className,
      )}
    >
      <div className="my-3 flex flex-wrap items-center justify-between gap-x-2">
        {collections ? (
          <CollectionSelector
            selectedCollection={selectedCollection}
            collections={collections}
            onChange={setCollectionId}
          />
        ) : (
          (collectionError ?? (
            <CollectionSelectSkeleton label="Loading capture collections" />
          ))
        )}

        <Button
          aria-label="Add expense manually"
          onClick={() => onManualEntry(collectionId)}
          className="ml-auto shrink-0 gap-2 rounded-lg bg-blue-50 px-2 text-xs text-blue-700 hover:bg-blue-100"
        >
          <SquarePlus className="size-4" />
          Manual
        </Button>
      </div>

      {collections && collectionError}

      <div className="mb-2 flex flex-row flex-wrap gap-2">
        {files.map((file, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: Index will not change
          <ImagePreview file={file} key={index} removeFile={handleRemoveFile} />
        ))}
      </div>

      <DescriptionComposer
        disabled={!selectedCollection || (files.length === 0 && !description)}
        value={description}
        onChange={setDescription}
        onSubmit={submit}
      />
      <div className="mt-4 flex items-center justify-evenly gap-3">
        <MediaButton
          kind="gallery"
          disabled={!selectedCollection}
          fileList={files}
          onChange={handleFileChange}
        />
        <RecordingButton
          onRecordingStart={handleRecordingStart}
          onRecordingStop={handleRecordingStop}
        />
        <MediaButton
          kind="camera"
          disabled={!selectedCollection}
          fileList={files}
          onChange={handleFileChange}
        />
      </div>
    </section>
  );
}

function DescriptionComposer({
  onSubmit,
  disabled,
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled: boolean;
}) {
  return (
    <form
      action={() => {
        if (!disabled) onSubmit();
      }}
      className="flex min-w-0 items-end rounded-xl border border-neutral-200 bg-neutral-50/50 focus-within:border-blue-500"
    >
      <TextArea
        aria-label="Describe an expense"
        placeholder="Describe…"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="block max-h-32 min-h-11 min-w-0 flex-1 resize-none overflow-y-auto rounded-lg border-0 bg-transparent px-3 py-3 text-base leading-5 text-neutral-900 shadow-none placeholder:text-neutral-400 focus:ring-0 focus:outline-none focus-visible:outline-none lg:text-sm"
      />
      <IconButton
        type="submit"
        aria-label="Add described expense"
        disabled={disabled}
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
            {collection.title}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-0 size-3.5 -translate-y-1/2" />
    </span>
  </label>
);

const MediaButton = ({
  kind,
  disabled,
  fileList,
  onChange,
}: {
  kind: "camera" | "gallery";
  disabled: boolean;
} & Pick<FileInputButtonProps, "fileList" | "onChange">) => {
  const Icon = kind === "camera" ? Camera : Images;
  return (
    <FileInputButton
      variant="ghost"
      disabled={disabled}
      aria-label={kind === "camera" ? "Take a photo" : "Choose from gallery"}
      className="min-w-16 flex-col gap-1 rounded-lg px-2 py-2 text-xs font-normal text-neutral-600 hover:bg-neutral-100"
      inputProps={{
        accept: "image/*",
        multiple: true,
        ...(kind === "camera" ? { capture: "environment" } : {}),
      }}
      fileList={fileList}
      onChange={onChange}
    >
      <Icon className="size-5" strokeWidth={1.5} />
      {kind === "camera" ? "Camera" : "Gallery"}
    </FileInputButton>
  );
};
