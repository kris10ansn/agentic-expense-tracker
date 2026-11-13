import { getRouteApi, Outlet } from "@tanstack/react-router";
import { AppShell } from "../../components/layout/AppShell";
import { WorkspaceProvider } from "./WorkspaceProvider";

const route = getRouteApi("/_app");

export function WorkspaceLayout() {
  const data = route.useLoaderData();
  return (
    <WorkspaceProvider data={data}>
      <AppShell collections={data.collections}>
        <Outlet />
      </AppShell>
    </WorkspaceProvider>
  );
}
