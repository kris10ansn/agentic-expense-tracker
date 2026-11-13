import { useQuery } from "@tanstack/react-query";
import { Outlet } from "@tanstack/react-router";
import { AppShell } from "../../components/layout/AppShell";
import { trpc } from "../../trpc";
import { WorkspaceProvider } from "./WorkspaceProvider";

export function WorkspaceLayout() {
  const collections = useQuery(trpc.collections.list.queryOptions());

  if (!collections.data) {
    return <p>Loading...</p>;
  }

  return (
    <WorkspaceProvider data={{ expenses: [], collections: collections.data }}>
      <AppShell collections={collections.data}>
        <Outlet />
      </AppShell>
    </WorkspaceProvider>
  );
}
