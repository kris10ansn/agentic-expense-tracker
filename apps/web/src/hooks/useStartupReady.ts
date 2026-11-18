import { useLayoutEffect } from "react";

// Call from a rendered screen, not the root provider: routes may still be loading.
export function useStartupReady() {
  useLayoutEffect(() => {
    document.getElementById("startup-screen")?.remove();
    document.getElementById("startup-error")?.remove();
    const root = document.getElementById("root");
    root?.removeAttribute("inert");
    root?.removeAttribute("aria-hidden");
  }, []);
}
