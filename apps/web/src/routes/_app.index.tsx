import { createFileRoute } from "@tanstack/react-router";
import { mockApi } from "../data/mock-api";
import { HomePage } from "../pages/HomePage";

export const Route = createFileRoute("/_app/")({
  loader: () => mockApi.captures.listPending(),
  component: HomePage,
});
