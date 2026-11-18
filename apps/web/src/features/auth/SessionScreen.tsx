import { LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../../components/inputs";
import { Logo } from "../../components/Logo";

type SessionScreenProps =
  | { kind: "loading" }
  | { kind: "error"; onRetry: () => void };

function LoadingStatus() {
  const [phase, setPhase] = useState<"hidden" | "loading" | "slow">("hidden");

  useEffect(() => {
    const show = setTimeout(() => setPhase("loading"), 200);
    const slow = setTimeout(() => setPhase("slow"), 5000);

    return () => {
      clearTimeout(show);
      clearTimeout(slow);
    };
  }, []);

  return (
    <div
      role="status"
      aria-atomic="true"
      className="flex flex-col items-center gap-4"
    >
      {phase !== "hidden" && (
        <>
          <LoaderCircle
            aria-hidden="true"
            className="size-5 text-blue-600 motion-safe:animate-spin"
          />
          <p className="text-sm leading-relaxed text-neutral-600">
            {phase === "slow"
              ? "This is taking longer than usual…"
              : "Loading your workspace…"}
          </p>
        </>
      )}
    </div>
  );
}

export function SessionScreen(props: SessionScreenProps) {
  return (
    <main className="font-inter flex min-h-dvh items-center justify-center bg-neutral-100 px-6 py-12 text-neutral-900">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-2xl">
          <Logo />
        </h1>
        <div className="mt-6 min-h-24">
          {props.kind === "loading" ? (
            <LoadingStatus />
          ) : (
            <>
              <p
                role="alert"
                className="text-sm leading-relaxed text-neutral-600"
              >
                We couldn't connect. Please try again.
              </p>
              <Button className="mt-4" onClick={props.onRetry}>
                Try again
              </Button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
