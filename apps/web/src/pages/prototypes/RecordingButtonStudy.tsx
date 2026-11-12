import { FolderOpen } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "../../components/PageHeader";
import { FloatingCaptureDock } from "./FloatingCaptureDock";
import { RecordingButton, type RecordingVariant } from "./RecordingButton";

export type { RecordingVariant } from "./RecordingButton";

export const recordingVariants = [
  {
    id: "pulse-wave",
    name: "Pulse + wave",
    description: "A soft pulse around the moving waveform",
  },
  {
    id: "glass-lens",
    name: "Glass lens",
    description: "A clear lens with a shifting light edge",
  },
  {
    id: "glass-ripple",
    name: "Glass ripple",
    description: "Fine glass rings expand from the button",
  },
] satisfies {
  id: RecordingVariant;
  name: string;
  description: string;
}[];

// Three held-button animation studies in the selected floating panel.
export function RecordingButtonStudy({
  variant,
}: {
  variant: RecordingVariant;
}) {
  const [text, setText] = useState("");

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <PageHeader title="Record button" />
      <p className="mt-3 max-w-md text-sm leading-relaxed text-neutral-500">
        Hold to try the animation. No audio is recorded.
      </p>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-end pt-12 pb-4 lg:justify-center lg:py-24">
        <FloatingCaptureDock
          text={text}
          setText={setText}
          collection={
            <div className="flex min-h-11 items-center gap-2 text-xs text-neutral-500">
              <FolderOpen className="size-4" strokeWidth={1.5} />
              <span className="font-medium text-neutral-800">Everyday</span>
            </div>
          }
          recordControl={<RecordingButton key={variant} variant={variant} />}
        />
        <p className="mt-6 hidden text-center text-xs leading-relaxed text-neutral-400 lg:block">
          You can also hold Space or Enter while the button is focused.
        </p>
      </div>
    </section>
  );
}
