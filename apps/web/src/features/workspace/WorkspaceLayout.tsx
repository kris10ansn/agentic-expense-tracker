import { Outlet } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { AppShell } from "../../components/layout/AppShell";
import { useStartupReady } from "../../hooks/useStartupReady";
import { WorkspaceProvider } from "./WorkspaceProvider";

export function WorkspaceLayout({ notice }: { notice?: ReactNode }) {
  useStartupReady();
  return (
    <WorkspaceProvider>
      <AppShell>
        {notice}
        <Outlet />
      </AppShell>
    </WorkspaceProvider>
  );
}
