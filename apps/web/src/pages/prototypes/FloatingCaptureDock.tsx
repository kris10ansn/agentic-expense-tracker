import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import {
  CaptureTextArea,
  MediaButton,
  RecordButton,
  SubmitDescriptionButton,
} from "./CaptureControls";
import type { VariantOption } from "./PrototypeControls";

export type DockVariant = "panel" | "split" | "sidecar";
export const dockVariants: VariantOption<DockVariant>[] = [
  { id: "panel", name: "Floating panel", description: "One raised composer" },
  { id: "split", name: "Split dock", description: "Separate text and voice" },
  {
    id: "sidecar",
    name: "Sidecar",
    description: "Recording beside the composer",
  },
];

type DockProps = {
  text: string;
  setText: (text: string) => void;
  collection: ReactNode;
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

function VoiceControls() {
  return (
    <div className="flex items-center justify-evenly gap-3">
      <MediaButton kind="gallery" stacked />
      <div className="flex flex-col items-center gap-2">
        <RecordButton />
        <span className="text-xs text-neutral-600">Hold to record</span>
      </div>
      <MediaButton kind="camera" stacked />
    </div>
  );
}

function FloatingPanel({ text, setText, collection }: DockProps) {
  return (
    <div className="rounded-3xl border border-neutral-200/80 bg-white/95 px-4 pt-1 pb-4 shadow-lg shadow-neutral-900/10 backdrop-blur-md">
      {collection}
      <TextComposer text={text} setText={setText} />
      <div className="mt-4">
        <VoiceControls />
      </div>
    </div>
  );
}

function SplitDock({ text, setText, collection }: DockProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-neutral-200/80 bg-white px-3 pt-1 pb-3 shadow-md shadow-neutral-900/5">
        {collection}
        <TextComposer
          text={text}
          setText={setText}
          className="border-0 bg-transparent"
        />
      </div>
      <div className="mx-auto max-w-xs rounded-full border border-neutral-200/80 bg-white/95 px-2 py-3 shadow-lg shadow-neutral-900/10 backdrop-blur-md">
        <VoiceControls />
      </div>
    </div>
  );
}

function SidecarDock({ text, setText, collection }: DockProps) {
  return (
    <div className="flex items-end gap-3">
      <div className="min-w-0 flex-1 rounded-2xl border border-neutral-200/80 bg-white px-2 pt-1 pb-2 shadow-lg shadow-neutral-900/10">
        {collection}
        <TextComposer
          text={text}
          setText={setText}
          className="border-0 bg-transparent"
        />
        <div className="flex justify-between border-t border-neutral-100 pt-1">
          <MediaButton kind="gallery" className="px-2" />
          <MediaButton kind="camera" className="px-2" />
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-center gap-2 pb-2">
        <RecordButton className="shadow-lg ring-4 shadow-blue-600/20 ring-white" />
        <span className="text-xs text-neutral-600">Hold to record</span>
      </div>
    </div>
  );
}

const docks = { panel: FloatingPanel, split: SplitDock, sidecar: SidecarDock };

export function FloatingCaptureDock({
  variant,
  ...props
}: DockProps & { variant: DockVariant }) {
  const Dock = docks[variant];
  return <Dock {...props} />;
}
