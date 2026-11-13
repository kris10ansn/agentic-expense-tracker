import { Mic } from "lucide-react";
import {
  type PointerEvent,
  useEffect,
  useEffectEvent,
  useId,
  useRef,
  useState,
} from "react";
import { twMerge } from "tailwind-merge";
import "./recording-button.css";

type HoldSource =
  | { kind: "pointer"; id: number }
  | { kind: "keyboard"; key: string }
  | null;

export type RecordingStopReason = "completed" | "cancelled";

export type RecordingButtonProps = {
  className?: string;
  disabled?: boolean;
  onRecordingStart?: () => void;
  onRecordingStop?: (reason: RecordingStopReason) => void;
};

export function RecordingButton({
  className,
  disabled = false,
  onRecordingStart,
  onRecordingStop,
}: RecordingButtonProps) {
  const hold = useRef<HoldSource>(null);
  const [isHeld, setIsHeld] = useState(false);
  const statusId = useId();

  function start(source: NonNullable<HoldSource>) {
    if (disabled || hold.current !== null) return;
    hold.current = source;
    setIsHeld(true);
    onRecordingStart?.();
  }

  function stop(reason: RecordingStopReason) {
    if (hold.current === null) return;
    hold.current = null;
    setIsHeld(false);
    onRecordingStop?.(reason);
  }

  function cancelPointer(event: PointerEvent<HTMLButtonElement>) {
    if (
      hold.current?.kind === "pointer" &&
      hold.current.id === event.pointerId
    ) {
      stop("cancelled");
    }
  }

  const cancelFromEffect = useEffectEvent(() => stop("cancelled"));

  useEffect(() => {
    function cancel() {
      cancelFromEffect();
    }
    function handleVisibilityChange() {
      if (document.hidden) cancel();
    }

    window.addEventListener("blur", cancel);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("blur", cancel);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      cancel();
    };
  }, []);

  useEffect(() => {
    if (disabled) cancelFromEffect();
  }, [disabled]);

  return (
    <div className="flex shrink-0 flex-col items-center gap-2">
      <button
        type="button"
        aria-label="Hold to record an expense"
        aria-describedby={statusId}
        aria-pressed={isHeld}
        data-held={isHeld}
        disabled={disabled}
        className={twMerge(
          "recording-button relative isolate grid size-16 shrink-0 cursor-pointer touch-none place-items-center rounded-full border-0 p-0 text-white select-none focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        onPointerDown={(event) => {
          if (!event.isPrimary || event.button !== 0 || hold.current !== null)
            return;
          event.currentTarget.setPointerCapture(event.pointerId);
          start({ kind: "pointer", id: event.pointerId });
        }}
        onPointerUp={(event) => {
          if (
            hold.current?.kind === "pointer" &&
            hold.current.id === event.pointerId
          ) {
            stop("completed");
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
              event.currentTarget.releasePointerCapture(event.pointerId);
            }
          }
        }}
        onPointerCancel={cancelPointer}
        onLostPointerCapture={cancelPointer}
        onBlur={() => stop("cancelled")}
        onContextMenu={(event) => event.preventDefault()}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            stop("cancelled");
            return;
          }
          if (event.key !== " " && event.key !== "Enter") return;
          event.preventDefault();
          if (event.repeat) return;
          start({ kind: "keyboard", key: event.key });
        }}
        onKeyUp={(event) => {
          if (
            hold.current?.kind === "keyboard" &&
            hold.current.key === event.key
          ) {
            event.preventDefault();
            stop("completed");
          }
        }}
      >
        <RecordingIndicator />
      </button>
      <p
        id={statusId}
        aria-live="polite"
        className="min-w-24 text-center text-xs font-medium text-neutral-600"
      >
        {isHeld ? "Release to finish" : "Hold to record"}
      </p>
    </div>
  );
}

function RecordingIndicator() {
  return (
    <>
      <span
        aria-hidden="true"
        className="recording-halo pointer-events-none absolute inset-0 -z-10 rounded-full"
      />
      <span
        aria-hidden="true"
        className="recording-face pointer-events-none absolute inset-0 rounded-full"
      />
      <Mic
        className="recording-microphone relative size-6"
        strokeWidth={1.7}
        aria-hidden="true"
      />
      <span
        aria-hidden="true"
        className="recording-wave pointer-events-none absolute inset-0 flex items-center justify-center gap-1"
      >
        <span className="h-3 w-1 rounded-full bg-white" />
        <span className="h-5 w-1 rounded-full bg-white" />
        <span className="h-6 w-1 rounded-full bg-white" />
        <span className="h-4 w-1 rounded-full bg-white" />
        <span className="h-3 w-1 rounded-full bg-white" />
      </span>
    </>
  );
}
