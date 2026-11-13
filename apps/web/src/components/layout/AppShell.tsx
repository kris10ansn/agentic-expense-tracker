import { Link, useLocation } from "@tanstack/react-router";
import { ArrowUpRight, FolderOpen, House, List, Settings } from "lucide-react";
import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import type { Collection } from "../../lib/expenses";

const navigation = [
  { to: "/", label: "Home", icon: House },
  { to: "/expenses", label: "Expenses", icon: List },
  { to: "/collections", label: "Collections", icon: FolderOpen },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function WorkspaceNavigation({ mobile = false }: { mobile?: boolean }) {
  return (
    <nav
      aria-label={mobile ? "Mobile navigation" : "Desktop navigation"}
      className={twMerge(
        "flex flex-col gap-1",
        mobile &&
          "fixed inset-x-0 bottom-0 z-30 grid h-(--mobile-navigation-height) grid-cols-4 border-t border-neutral-200 bg-white px-2 pb-[env(safe-area-inset-bottom)] lg:hidden",
      )}
    >
      {navigation.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          activeOptions={{ exact: true, includeSearch: false }}
          className={twMerge(
            "flex min-h-11 items-center gap-3 rounded-lg px-3 text-left text-sm text-neutral-500 transition-colors hover:bg-neutral-200/50 data-[status=active]:font-medium",
            mobile
              ? "flex-col justify-center gap-1 px-0 text-xs hover:bg-neutral-50 data-[status=active]:text-blue-600"
              : "data-[status=active]:bg-neutral-200/60 data-[status=active]:text-neutral-950",
          )}
        >
          <Icon className="size-5 shrink-0" strokeWidth={1.5} />
          {label}
        </Link>
      ))}
    </nav>
  );
}

export function AppShell({
  children,
  collections,
}: {
  children: ReactNode;
  collections: Collection[];
}) {
  const isHome = useLocation({
    select: (location) => location.pathname === "/",
  });
  return (
    <div className="expense-workspace font-inter min-h-dvh bg-neutral-100 text-neutral-900 lg:p-5">
      <aside className="fixed inset-y-8 left-5 hidden w-52 flex-col px-3 pt-3 lg:flex">
        <Link
          to="/"
          aria-label="Expenses home"
          className="px-3 text-xl font-semibold tracking-tight"
        >
          expenses<span className="text-blue-600">.</span>
        </Link>
        <div className="mt-10">
          <WorkspaceNavigation />
        </div>
        <div className="mt-9 min-h-0 overflow-y-auto">
          <p className="mb-3 px-3 text-xs text-neutral-400">Collections</p>
          {collections.map((collection) => (
            <Link
              key={collection.id}
              to="/expenses"
              search={{ collection: collection.id }}
              className="flex min-h-10 items-center gap-3 rounded-lg px-3 text-left text-xs text-neutral-500 hover:bg-neutral-200/50"
            >
              <span
                className="size-1.5 shrink-0 rounded-full"
                style={{ background: collection.color }}
              />
              <span className="truncate">{collection.name}</span>
            </Link>
          ))}
        </div>
        <Link
          to="/playground"
          className="mt-auto flex min-h-11 items-center gap-1 px-3 text-xs text-neutral-500"
        >
          Playground
          <ArrowUpRight className="size-3" />
        </Link>
      </aside>
      <div className="min-h-dvh bg-white lg:ml-56 lg:min-h-[calc(100dvh-var(--spacing)*10)] lg:rounded-2xl lg:border lg:border-neutral-200">
        <main
          className={twMerge(
            "mx-auto max-w-6xl px-5 pt-6 pb-28 sm:px-8 lg:pt-10 lg:pb-28",
            isHome &&
              "flex h-(--home-height) min-h-0 flex-col overflow-y-auto pb-5 lg:h-auto lg:min-h-0 lg:overflow-visible lg:pb-28",
          )}
        >
          {children}
        </main>
      </div>
      <WorkspaceNavigation mobile />
    </div>
  );
}
