import { Outlet } from "@tanstack/react-router";
import { AppShell } from "../../components/layout/AppShell";
import { WorkspaceProvider } from "./WorkspaceProvider";

export function WorkspaceLayout() {
  return (
    <WorkspaceProvider>
      <AppShell>
        <Outlet />
      </AppShell>
    </WorkspaceProvider>
  );
}
