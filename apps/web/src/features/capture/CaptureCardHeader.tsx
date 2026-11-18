import {
  CircleCheck,
  CircleX,
  LoaderCircle,
  TriangleAlert,
  WifiOff,
} from "lucide-react";
import { twMerge } from "tailwind-merge";
import type { CaptureCardState } from "./useCaptureProgress";

const headings = {
  sending: { title: "Pending entry", icon: LoaderCircle },
  connecting: { title: "Checking progress", icon: WifiOff },
  extracting: { title: "Pending entry", icon: LoaderCircle },
  saving: { title: "Pending entry", icon: LoaderCircle },
  complete: { title: "Complete", icon: CircleCheck },
  disconnected: { title: "Status unavailable", icon: WifiOff },
  failed: { title: "Capture failed", icon: CircleX },
  "needs-review": {
    title: "Capture complete · Review needed",
    icon: TriangleAlert,
  },
} satisfies Record<
  CaptureCardState["kind"],
  { title: string; icon: typeof LoaderCircle }
>;

export function CaptureCardHeader({
  kind,
}: {
  kind: CaptureCardState["kind"];
}) {
  const { title, icon: Icon } = headings[kind];
  const processing =
    kind === "sending" || kind === "extracting" || kind === "saving";

  return (
    <div
      className={twMerge(
        "flex items-center gap-1.5 text-xs font-medium text-neutral-500",
        kind === "failed" && "text-red-700",
        kind === "needs-review" && "text-amber-700",
      )}
    >
      <Icon
        aria-hidden="true"
        className={twMerge(
          "size-3.5 shrink-0",
          processing && "motion-safe:animate-spin",
        )}
        strokeWidth={1.75}
      />
      <span>{title}</span>
    </div>
  );
}
