import { Outlet } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { AppShell } from "../../components/layout/AppShell";
import { WorkspaceProvider } from "./WorkspaceProvider";

export function WorkspaceLayout({ notice }: { notice?: ReactNode }) {
  return (
    <WorkspaceProvider>
      <AppShell>
        {notice}
        <Outlet />
      </AppShell>
    </WorkspaceProvider>
  );
}
