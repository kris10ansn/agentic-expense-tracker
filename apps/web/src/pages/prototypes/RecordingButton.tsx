import { Mic } from "lucide-react";
import { useCallback, useEffect, useId, useState } from "react";
import { twMerge } from "tailwind-merge";
import "./recording-button.css";

export type RecordingVariant = "pulse-wave" | "glass-lens" | "glass-ripple";

type HoldSource =
  | { kind: "pointer"; id: number }
  | { kind: "keyboard"; key: string }
  | null;

// A held-state visual preview. This component never requests microphone access.
export function RecordingButton({
  variant = "pulse-wave",
  className,
}: {
  variant?: RecordingVariant;
  className?: string;
}) {
  const [hold, setHold] = useState<HoldSource>(null);
  const statusId = useId();
  const release = useCallback(() => setHold(null), []);

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.hidden) release();
    }

    window.addEventListener("blur", release);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("blur", release);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [release]);

  return (
    <div className="flex shrink-0 flex-col items-center gap-2">
      <button
        type="button"
        aria-label="Hold to preview recording"
        aria-describedby={statusId}
        aria-pressed={hold !== null}
        data-variant={variant}
        data-held={hold !== null}
        className={twMerge(
          "recording-button relative isolate grid size-16 shrink-0 cursor-pointer touch-none place-items-center rounded-full border-0 p-0 text-white select-none focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-blue-600",
          className,
        )}
        onPointerDown={(event) => {
          if (!event.isPrimary || event.button !== 0 || hold !== null) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          setHold({ kind: "pointer", id: event.pointerId });
        }}
        onPointerUp={(event) => {
          if (hold?.kind === "pointer" && hold.id === event.pointerId) {
            release();
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
              event.currentTarget.releasePointerCapture(event.pointerId);
            }
          }
        }}
        onPointerCancel={release}
        onLostPointerCapture={release}
        onBlur={release}
        onContextMenu={(event) => event.preventDefault()}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            release();
            return;
          }
          if (event.key !== " " && event.key !== "Enter") return;
          event.preventDefault();
          if (event.repeat || hold !== null) return;
          setHold({ kind: "keyboard", key: event.key });
        }}
        onKeyUp={(event) => {
          if (hold?.kind === "keyboard" && hold.key === event.key) {
            event.preventDefault();
            release();
          }
        }}
      >
        {variant === "pulse-wave" && (
          <span className="recording-halo pointer-events-none absolute inset-0 -z-10 rounded-full" />
        )}
        {variant === "glass-ripple" && (
          <span
            aria-hidden="true"
            className="recording-ripples pointer-events-none absolute inset-0 -z-10"
          >
            <span className="absolute inset-0 rounded-full" />
            <span className="absolute inset-0 rounded-full" />
          </span>
        )}
        <span className="recording-face pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
          {variant !== "pulse-wave" && (
            <>
              <span className="recording-glass-refraction absolute inset-0 rounded-full" />
              <span className="recording-glass-reflection absolute inset-0 rounded-full" />
              <span className="recording-glass-rim absolute inset-0 rounded-full" />
            </>
          )}
        </span>
        <Mic
          className="recording-microphone relative size-6"
          strokeWidth={1.7}
          aria-hidden="true"
        />
        {variant === "pulse-wave" && (
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
        )}
      </button>
      <p
        id={statusId}
        aria-live="polite"
        className="min-w-24 text-center text-xs font-medium text-neutral-600"
      >
        {hold !== null ? "Release to finish" : "Hold to record"}
      </p>
    </div>
  );
}
