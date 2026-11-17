import { createFileRoute } from "@tanstack/react-router";
import { AuthenticatedWorkspace } from "../features/auth/AuthenticatedWorkspace";

export const Route = createFileRoute("/_app")({
  component: AuthenticatedWorkspace,
});
