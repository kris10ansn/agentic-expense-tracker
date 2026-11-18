import { useEffect, useState } from "react";
import { Button } from "../../components/inputs";
import {
  type LoadingPhase,
  LoadingScreen,
} from "../../components/LoadingScreen";

type SessionScreenProps =
  | { kind: "loading" }
  | { kind: "error"; onRetry: () => void };

function SessionLoadingScreen() {
  // Continue an already-visible startup screen without hiding its indicator.
  const [phase, setPhase] = useState<LoadingPhase>(() =>
    document.getElementById("startup-screen") ? "loading" : "hidden",
  );
  useEffect(() => {
    const show = setTimeout(() => setPhase("loading"), 200);
    const slow = setTimeout(() => setPhase("slow"), 5000);

    return () => {
      clearTimeout(show);
      clearTimeout(slow);
    };
  }, []);

  return <LoadingScreen kind="loading" phase={phase} />;
}

export function SessionScreen(props: SessionScreenProps) {
  if (props.kind === "error") {
    return (
      <LoadingScreen
        kind="error"
        message="We couldn't connect. Please try again."
        action={<Button onClick={props.onRetry}>Try again</Button>}
      />
    );
  }
  return <SessionLoadingScreen />;
}
