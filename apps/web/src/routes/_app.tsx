import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "../components/layout/AppShell";
import { mockApi } from "../data/mock-api";
import { WorkspaceProvider } from "../features/workspace/WorkspaceProvider";

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

function WorkspaceLayout() {
  const data = Route.useLoaderData();
  return (
    <WorkspaceProvider data={data}>
      <AppShell collections={data.collections}>
        <Outlet />
      </AppShell>
    </WorkspaceProvider>
  );
}
