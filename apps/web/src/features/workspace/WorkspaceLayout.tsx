import { Outlet } from "@tanstack/react-router";
import { AppShell } from "../../components/layout/AppShell";
import { WorkspaceProvider } from "./WorkspaceProvider";

// Replace these empty collections with React Query results when connecting the API.
const data = { expenses: [], collections: [] };

export function WorkspaceLayout() {
  return (
    <WorkspaceProvider data={data}>
      <AppShell collections={data.collections}>
        <Outlet />
      </AppShell>
    </WorkspaceProvider>
  );
}
