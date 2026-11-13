import { createFileRoute } from "@tanstack/react-router";
import { CollectionsPage } from "../pages/CollectionsPage";

export const Route = createFileRoute("/_app/collections")({
  component: CollectionsPage,
});
