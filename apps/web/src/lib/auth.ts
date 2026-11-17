import type { AppRouter } from "@ai-expenses/api";
import { isTRPCClientError } from "@trpc/client";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();

let navigatingToLogin = false;

// A document navigation clears query caches, drafts, and subscriptions together.
export function goToLogin() {
  if (navigatingToLogin) {
    return;
  }
  navigatingToLogin = true;
  window.location.replace("/login");
}

export function handleAuthenticationError(error: unknown) {
  if (
    isTRPCClientError<AppRouter>(error) &&
    error.data?.code === "UNAUTHORIZED"
  ) {
    goToLogin();
  }
}
