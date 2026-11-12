import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import {
  CaptureTextArea,
  MediaButton,
  RecordButton,
  SubmitDescriptionButton,
} from "./CaptureControls";

type DockProps = {
  text: string;
  setText: (text: string) => void;
  collection: ReactNode;
  recordControl?: ReactNode;
};

function TextComposer({
  text,
  setText,
  className,
}: Pick<DockProps, "text" | "setText"> & { className?: string }) {
  return (
    <div
      className={twMerge(
        "flex min-w-0 items-end rounded-xl border border-neutral-200 bg-neutral-50/50 focus-within:border-blue-500",
        className,
      )}
    >
      <CaptureTextArea
        placeholder="Describe…"
        value={text}
        onChange={(event) => setText(event.target.value)}
        className="min-w-0 flex-1"
      />
      <div className="p-1">
        <SubmitDescriptionButton />
      </div>
    </div>
  );
}

function VoiceControls({ recordControl }: Pick<DockProps, "recordControl">) {
  return (
    <div className="flex items-center justify-evenly gap-3">
      <MediaButton kind="gallery" stacked />
      {recordControl ?? (
        <div className="flex flex-col items-center gap-2">
          <RecordButton />
          <span className="text-xs text-neutral-600">Hold to record</span>
        </div>
      )}
      <MediaButton kind="camera" stacked />
    </div>
  );
}

export function FloatingCaptureDock({
  text,
  setText,
  collection,
  recordControl,
}: DockProps) {
  return (
    <div className="rounded-3xl border border-neutral-200/80 bg-white/95 px-4 pt-1 pb-4 shadow-lg shadow-neutral-900/10 backdrop-blur-md">
      {collection}
      <TextComposer text={text} setText={setText} />
      <div className="mt-4">
        <VoiceControls recordControl={recordControl} />
      </div>
    </div>
  );
}
