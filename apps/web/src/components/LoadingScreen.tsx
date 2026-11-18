import { LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";
import { Logo } from "./Logo.tsx";

export type LoadingPhase = "hidden" | "loading" | "slow";

type LoadingScreenProps =
  | { kind: "loading"; phase: LoadingPhase }
  | { kind: "error"; message: string; action: ReactNode };

// Also rendered to HTML by Vite before any browser JavaScript runs.
export function LoadingScreen(props: LoadingScreenProps) {
  return (
    <main className="font-inter flex min-h-dvh items-center justify-center bg-neutral-100 px-6 py-12 text-neutral-900">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-2xl">
          <Logo />
        </h1>
        <div className="mt-6 min-h-24">
          {props.kind === "loading" ? (
            <div
              role="status"
              aria-atomic="true"
              className="flex flex-col items-center gap-4"
            >
              {props.phase !== "hidden" && (
                <>
                  <LoaderCircle
                    aria-hidden="true"
                    className="size-5 text-blue-600 motion-safe:animate-spin"
                  />
                  <p className="text-sm leading-relaxed text-neutral-600">
                    {props.phase === "slow"
                      ? "This is taking longer than usual…"
                      : "Loading your workspace…"}
                  </p>
                </>
              )}
            </div>
          ) : (
            <>
              <p
                role="alert"
                className="text-sm leading-relaxed text-neutral-600"
              >
                {props.message}
              </p>
              <div className="mt-4">{props.action}</div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
