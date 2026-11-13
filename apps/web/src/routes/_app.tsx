import { createFileRoute } from "@tanstack/react-router";
import { mockApi } from "../data/mock-api";
import { WorkspaceLayout } from "../features/workspace/WorkspaceLayout";

export const Route = createFileRoute("/_app")({
  loader: async () => {
    const [expenses, collections] = await Promise.all([
      mockApi.expenses.list(),
      mockApi.collections.list(),
    ]);
    return { expenses, collections };
  },
  component: WorkspaceLayout,
});
