import { ArrowUp, Camera, FolderOpen, Images } from "lucide-react";
import { IconButton } from "../../components/inputs";
import { CaptureTextArea } from "./CaptureControls";
import { RecordingButton, type RecordingVariant } from "./RecordingButton";

export type { RecordingVariant } from "./RecordingButton";

export const recordingVariants = [
  {
    id: "pulse",
    name: "Soft pulse",
    description: "A gentle press with a breathing halo",
  },
  {
    id: "wave",
    name: "Wave",
    description: "The microphone becomes a moving waveform",
  },
  {
    id: "glass",
    name: "Liquid glass",
    description: "Soft reflections and a fluid glass button",
  },
] satisfies {
  id: RecordingVariant;
  name: string;
  description: string;
}[];

// Three held-button animation studies, selected on /prototypes/recording?variant=.
export function RecordingButtonStudy({
  variant,
}: {
  variant: RecordingVariant;
}) {
  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        Record button
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-neutral-500">
        Hold to try the animation. No audio is recorded.
      </p>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-end pt-12 pb-4 lg:justify-center lg:py-24">
        <div className="mb-3 flex items-center gap-2 text-xs text-neutral-500">
          <FolderOpen className="size-4" strokeWidth={1.5} />
          Add to <span className="font-medium text-neutral-800">Everyday</span>
        </div>
        <div className="mb-8 flex items-end rounded-xl border border-neutral-200 bg-neutral-50/50 focus-within:border-blue-500">
          <CaptureTextArea
            rows={1}
            className="min-h-11 min-w-0 flex-1 px-3 py-3"
          />
          <div className="p-1">
            <IconButton
              aria-label="Add described expense"
              className="size-10 text-neutral-500"
            >
              <ArrowUp className="size-4" />
            </IconButton>
          </div>
        </div>
        <div className="grid grid-cols-3 items-start gap-2">
          <div className="flex flex-col items-center gap-4 pt-4">
            <IconButton
              aria-label="Choose from gallery"
              className="size-12 rounded-full text-neutral-500"
            >
              <Images className="size-5" strokeWidth={1.5} />
            </IconButton>
            <span className="text-xs text-neutral-500">Gallery</span>
          </div>
          <RecordingButton
            key={variant}
            variant={variant}
            className="size-20"
          />
          <div className="flex flex-col items-center gap-4 pt-4">
            <IconButton
              aria-label="Take a photo"
              className="size-12 rounded-full text-neutral-500"
            >
              <Camera className="size-5" strokeWidth={1.5} />
            </IconButton>
            <span className="text-xs text-neutral-500">Camera</span>
          </div>
        </div>
        <p className="mt-8 text-center text-xs leading-relaxed text-neutral-400">
          You can also hold Space or Enter while the button is focused.
        </p>
      </div>
    </section>
  );
}
