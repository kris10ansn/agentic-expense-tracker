import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { router } from "./router";
import "./styles.css";
import { queryClient } from "./lib/query-client";

const root = document.getElementById("root");
if (!root) {
  throw new Error("The root element is missing.");
}

// Wait for route content to reach the DOM before dismissing the initial HTML.
const unsubscribeStartup = router.subscribe("onRendered", () => {
  document.getElementById("startup-screen")?.remove();
  document.getElementById("startup-error")?.remove();
  root.removeAttribute("inert");
  root.removeAttribute("aria-hidden");
  unsubscribeStartup();
});
import.meta.hot?.dispose(unsubscribeStartup);

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
