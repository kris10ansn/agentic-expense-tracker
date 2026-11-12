import {
  ArrowUpRight,
  FlaskConical,
  FolderOpen,
  LayoutDashboard,
  ListFilter,
  Wallet,
} from "lucide-react";
import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import type { Collection, WorkspaceView } from "../../lib/expenses";

const navigation: { id: WorkspaceView; label: string; icon: typeof Wallet }[] =
  [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "expenses", label: "Expenses", icon: ListFilter },
    { id: "collections", label: "Collections", icon: FolderOpen },
  ];

type NavigationProps = {
  view: WorkspaceView;
  onViewChange: (view: WorkspaceView) => void;
};

function Navigation({
  view,
  onViewChange,
  mobile = false,
}: NavigationProps & { mobile?: boolean }) {
  return (
    <nav
      aria-label={mobile ? "Mobile navigation" : "Main navigation"}
      className={twMerge("flex flex-col gap-1", mobile && "grid grid-cols-3")}
    >
      {navigation.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          aria-current={view === id ? "page" : undefined}
          onClick={() => onViewChange(id)}
          className={twMerge(
            "flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 text-left text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100",
            view === id && "bg-emerald-50 text-emerald-800",
            mobile &&
              "min-h-14 flex-col justify-center gap-1 rounded-xl px-1 text-xs",
          )}
        >
          <Icon className="size-5" strokeWidth={1.7} />
          {label}
        </button>
      ))}
    </nav>
  );
}

function Brand({ className }: { className?: string }) {
  return (
    <a
      href="/"
      aria-label="AI Expenses home"
      className={twMerge(
        "inline-flex items-center gap-3 text-base font-semibold tracking-tight text-slate-900",
        className,
      )}
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-800 text-white">
        <Wallet className="size-5" strokeWidth={1.7} />
      </span>
      <span>
        AI Expenses
        <span className="mt-0.5 hidden text-xs font-normal tracking-normal text-slate-400 lg:block">
          A little more clarity.
        </span>
      </span>
    </a>
  );
}

export function AppShell({
  view,
  onViewChange,
  collections,
  selectedCollection,
  onCollectionChange,
  children,
}: NavigationProps & {
  collections: Collection[];
  selectedCollection: string;
  onCollectionChange: (id: string) => void;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-white focus:p-3"
      >
        Skip to content
      </a>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-slate-200 bg-white px-5 pt-8 lg:flex">
        <Brand className="px-2" />
        <p className="mt-10 mb-3 px-3 text-xs font-medium tracking-widest text-slate-400">
          WORKSPACE
        </p>
        <Navigation view={view} onViewChange={onViewChange} />
        <div className="mt-8 min-h-0 overflow-y-auto">
          <div className="mb-3 flex justify-between px-3 text-xs font-medium tracking-wider text-slate-400">
            <span>YOUR COLLECTIONS</span>
            <span>{collections.length}</span>
          </div>
          {collections.map((collection) => (
            <button
              key={collection.id}
              type="button"
              onClick={() => onCollectionChange(collection.id)}
              className={twMerge(
                "flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-lg px-3 text-left text-xs text-slate-500 hover:bg-slate-50",
                selectedCollection === collection.id &&
                  "bg-slate-100 text-slate-800",
              )}
            >
              <span
                className="size-2 shrink-0 rounded-sm"
                style={{ backgroundColor: collection.color }}
              />
              <span className="truncate">{collection.name}</span>
            </button>
          ))}
        </div>
        <div className="mt-auto pt-8">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
            <p className="text-xs font-medium text-emerald-800">
              Make yourself at home
            </p>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              This is a demo. Add, edit, and explore. Changes reset on refresh.
            </p>
          </div>
          <a
            href="/playground"
            className="my-4 flex min-h-11 items-center gap-2 px-3 text-xs text-slate-500 hover:text-emerald-800"
          >
            <FlaskConical className="size-4" />
            AI playground
            <ArrowUpRight className="ml-auto size-4" />
          </a>
          <div className="flex items-center gap-3 border-t border-slate-100 py-5">
            <span className="grid size-9 place-items-center rounded-full bg-slate-100 text-xs text-slate-600">
              P
            </span>
            <div className="text-xs font-medium text-slate-700">
              Personal workspace
              <p className="mt-1 font-normal text-slate-400">
                All amounts in NOK
              </p>
            </div>
          </div>
        </div>
      </aside>
      <div className="min-w-0 lg:ml-60">
        <header className="sticky top-0 z-20 flex h-18 items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-5 backdrop-blur-sm sm:px-8 lg:static lg:px-10">
          <Brand className="lg:hidden" />
          <div className="hidden items-center gap-4 text-xs text-slate-400 lg:flex">
            Personal workspace<span className="text-slate-300">/</span>
            <span className="font-medium text-slate-600">
              {navigation.find((item) => item.id === view)?.label}
            </span>
          </div>
          <span className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs whitespace-nowrap text-slate-500">
            <span className="size-1.5 rounded-full bg-emerald-600" />
            Demo<span className="hidden sm:inline"> workspace</span>
          </span>
        </header>
        <main
          id="main-content"
          className="mx-auto max-w-7xl px-4 pt-7 pb-6 sm:px-8 sm:pt-10 lg:px-10"
        >
          {children}
        </main>
        <footer className="mx-auto flex max-w-7xl flex-col gap-3 px-5 pt-2 pb-28 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10 lg:pb-6">
          <span>Sample data. Changes reset on refresh.</span>
          <a
            href="/playground"
            className="flex min-h-11 items-center gap-1 hover:text-emerald-800"
          >
            Open AI playground
            <ArrowUpRight className="size-3" />
          </a>
        </footer>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden">
        <Navigation mobile view={view} onViewChange={onViewChange} />
      </div>
    </div>
  );
}
