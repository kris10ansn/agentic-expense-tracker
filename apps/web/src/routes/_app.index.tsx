import { createFileRoute } from "@tanstack/react-router";
import { mockApi } from "../data/mock-api";
import { HomePage } from "../pages/HomePage";

export const Route = createFileRoute("/_app/")({
  loader: () => mockApi.captures.listPending(),
  component: HomeRoute,
});

function HomeRoute() {
  return <HomePage pendingCaptures={Route.useLoaderData()} />;
}
