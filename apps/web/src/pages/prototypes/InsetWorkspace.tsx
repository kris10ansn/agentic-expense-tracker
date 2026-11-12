import { ArrowUpRight, FolderOpen, House, List, Settings } from "lucide-react";
import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import type { WorkspaceView } from "../../lib/expenses";
import { type PrototypeProps, prototypeStudies } from "./PrototypeControls";

const navigation = [
  { view: "home", label: "Home", icon: House },
  { view: "expenses", label: "Expenses", icon: List },
  { view: "collections", label: "Collections", icon: FolderOpen },
  { view: "settings", label: "Settings", icon: Settings },
] satisfies { view: WorkspaceView; label: string; icon: typeof House }[];

function Brand() {
  return (
    <a
      href="/"
      aria-label="Expenses home"
      className="text-xl font-semibold tracking-tight"
    >
      expenses<span className="text-blue-600">.</span>
    </a>
  );
}

function WorkspaceNavigation({
  workspace,
  mobile = false,
}: PrototypeProps & { mobile?: boolean }) {
  return (
    <nav
      aria-label={mobile ? "Mobile navigation" : "Desktop navigation"}
      className={twMerge(
        "flex flex-col gap-1",
        mobile &&
          "fixed inset-x-0 bottom-0 z-30 grid h-(--mobile-navigation-height) grid-cols-4 border-t border-neutral-200 bg-white px-2 pb-[env(safe-area-inset-bottom)] lg:hidden",
      )}
    >
      {navigation.map(({ view, label, icon: Icon }) => (
        <button
          key={view}
          type="button"
          aria-current={workspace.view === view ? "page" : undefined}
          onClick={() => workspace.changeView(view)}
          className={twMerge(
            "flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 text-left text-sm text-neutral-500 transition-colors hover:bg-neutral-200/50",
            workspace.view === view &&
              "bg-neutral-200/60 font-medium text-neutral-950",
            mobile &&
              "flex-col justify-center gap-1 bg-transparent px-0 text-xs hover:bg-neutral-50",
            mobile && workspace.view === view && "bg-transparent text-blue-600",
          )}
        >
          <Icon
            className="size-5 shrink-0"
            strokeWidth={workspace.view === view ? 1.8 : 1.5}
          />
          {label}
        </button>
      ))}
    </nav>
  );
}

export function InsetWorkspace({
  workspace,
  children,
  capture = false,
}: PrototypeProps & { children: ReactNode; capture?: boolean }) {
  return (
    <div className="min-h-[calc(100dvh-var(--prototype-toolbar-height))] bg-neutral-100 text-neutral-900 lg:min-h-dvh lg:p-5">
      <aside className="fixed inset-y-8 left-5 hidden w-52 flex-col px-3 pt-3 lg:flex">
        <div className="px-3">
          <Brand />
        </div>
        <div className="mt-10">
          <WorkspaceNavigation workspace={workspace} />
        </div>
        <div className="mt-9 min-h-0 overflow-y-auto">
          <p className="mb-3 px-3 text-xs text-neutral-400">Collections</p>
          {workspace.collections.map((collection) => (
            <button
              key={collection.id}
              type="button"
              onClick={() => workspace.openCollection(collection.id)}
              className="flex min-h-10 w-full cursor-pointer items-center gap-3 rounded-lg px-3 text-left text-xs text-neutral-500 hover:bg-neutral-200/50"
            >
              <span
                className="size-1.5 shrink-0 rounded-full"
                style={{ background: collection.color }}
              />
              <span className="truncate">{collection.name}</span>
            </button>
          ))}
        </div>
        {import.meta.env.DEV && (
          <div className="mt-6">
            {prototypeStudies.map((study) => (
              <a
                key={study.href}
                href={study.href}
                className="flex min-h-10 items-center gap-1 px-3 text-xs text-neutral-500 hover:text-neutral-900"
              >
                {study.label}
                <ArrowUpRight className="size-3" />
              </a>
            ))}
          </div>
        )}
        <a
          href="/playground"
          className="mt-auto flex min-h-11 items-center gap-1 px-3 text-xs text-neutral-500"
        >
          Playground
          <ArrowUpRight className="size-3" />
        </a>
      </aside>
      <div className="min-h-[calc(100dvh-var(--prototype-toolbar-height))] bg-white lg:ml-56 lg:min-h-[calc(100dvh-var(--spacing)*10)] lg:rounded-2xl lg:border lg:border-neutral-200">
        <main
          className={twMerge(
            "mx-auto max-w-6xl px-5 pt-6 pb-28 sm:px-8 lg:pt-10 lg:pb-28",
            capture &&
              workspace.view === "home" &&
              "flex h-(--home-height) min-h-0 flex-col overflow-y-auto pb-5 lg:h-auto lg:min-h-0 lg:overflow-visible lg:pb-28",
          )}
        >
          {children}
        </main>
      </div>
      <WorkspaceNavigation workspace={workspace} mobile />
    </div>
  );
}
