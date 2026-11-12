import { ArrowUpRight, FolderOpen, List, Settings } from "lucide-react";
import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import { categories, formatAmount, formatDate } from "../../lib/expenses";
import {
  AddAction,
  CollectionFilter,
  EmptyExpenses,
  ExpenseSearch,
  MonthFilter,
  PrototypeCollectionList,
  type PrototypeProps,
  type PrototypeWorkspace,
  type VariantOption,
} from "./PrototypeControls";

export type LedgerVariant = "sidebar" | "rail" | "inset";
export const ledgerVariants: VariantOption[] = [
  { id: "sidebar", name: "Sidebar", description: "Full navigation" },
  { id: "rail", name: "Rail", description: "Compact navigation" },
  { id: "inset", name: "Inset", description: "Framed workspace" },
];

const navigation = [
  { view: "expenses", label: "Expenses", icon: List },
  { view: "collections", label: "Collections", icon: FolderOpen },
  { view: "settings", label: "Settings", icon: Settings },
] satisfies {
  view: "expenses" | "collections" | "settings";
  label: string;
  icon: typeof List;
}[];

type LayoutProps = PrototypeProps & { children: ReactNode };

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <a
      href="/"
      aria-label="Expenses home"
      className="text-xl font-semibold tracking-tight"
    >
      {compact ? "e" : "expenses"}
      <span className="text-blue-600">.</span>
    </a>
  );
}

function DesktopNavigation({
  workspace,
  compact = false,
}: PrototypeProps & { compact?: boolean }) {
  return (
    <nav aria-label="Desktop navigation" className="flex flex-col gap-1">
      {navigation.map(({ view, label, icon: Icon }) => (
        <button
          key={view}
          type="button"
          title={compact ? label : undefined}
          aria-label={label}
          aria-current={workspace.view === view ? "page" : undefined}
          onClick={() => workspace.changeView(view)}
          className={twMerge(
            "flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 text-left text-sm text-neutral-500 transition-colors hover:bg-neutral-100",
            workspace.view === view &&
              "bg-neutral-100 font-medium text-neutral-950",
            compact && "size-12 justify-center px-0",
          )}
        >
          <Icon className="size-5 shrink-0" strokeWidth={1.6} />
          <span className={compact ? "sr-only" : undefined}>{label}</span>
        </button>
      ))}
    </nav>
  );
}

function MobileNavigation({
  workspace,
  floating = false,
}: PrototypeProps & { floating?: boolean }) {
  return (
    <nav
      aria-label="Mobile navigation"
      className={twMerge(
        "fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t border-neutral-200 bg-white/95 px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden",
        floating &&
          "inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] rounded-2xl border p-2 shadow-sm",
      )}
    >
      {navigation.map(({ view, label, icon: Icon }) => (
        <button
          type="button"
          key={view}
          onClick={() => workspace.changeView(view)}
          aria-current={workspace.view === view ? "page" : undefined}
          className={twMerge(
            "flex min-h-12 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl text-xs text-neutral-400",
            workspace.view === view && "font-medium text-neutral-950",
            floating && workspace.view === view && "bg-neutral-900 text-white",
          )}
        >
          <Icon
            className="size-5"
            strokeWidth={workspace.view === view ? 1.8 : 1.5}
          />
          {label}
        </button>
      ))}
    </nav>
  );
}

function CollectionShortcuts({ workspace }: PrototypeProps) {
  return (
    <div className="mt-9 min-h-0 overflow-y-auto">
      <p className="mb-3 px-3 text-xs text-neutral-400">Collections</p>
      {workspace.collections.map((collection) => (
        <button
          key={collection.id}
          type="button"
          onClick={() => workspace.openCollection(collection.id)}
          className="flex min-h-10 w-full cursor-pointer items-center gap-3 rounded-lg px-3 text-left text-xs text-neutral-500 hover:bg-neutral-100"
        >
          <span
            className="size-1.5 shrink-0 rounded-full"
            style={{ background: collection.color }}
          />
          <span className="truncate">{collection.name}</span>
        </button>
      ))}
    </div>
  );
}

function MobileHeader() {
  return (
    <header className="flex h-16 items-center border-b border-neutral-100 bg-white px-5 lg:hidden">
      <Brand />
    </header>
  );
}

function SidebarLayout({ workspace, children }: LayoutProps) {
  return (
    <div className="font-inter min-h-dvh bg-white text-neutral-900">
      <aside className="fixed inset-y-0 left-0 hidden w-56 flex-col border-r border-neutral-200 px-5 pt-9 lg:flex">
        <div className="px-3">
          <Brand />
        </div>
        <div className="mt-10">
          <DesktopNavigation workspace={workspace} />
        </div>
        <CollectionShortcuts workspace={workspace} />
        <p className="mt-auto px-3 py-7 text-xs text-neutral-400">
          Personal workspace
        </p>
      </aside>
      <div className="lg:ml-56">
        <MobileHeader />
        <main className="mx-auto max-w-6xl px-5 pt-7 pb-48 sm:px-10 lg:pt-12">
          {children}
        </main>
      </div>
      <MobileNavigation workspace={workspace} />
    </div>
  );
}

function RailLayout({ workspace, children }: LayoutProps) {
  return (
    <div className="font-inter min-h-dvh bg-white text-neutral-900">
      <aside className="fixed inset-y-0 left-0 hidden w-20 flex-col items-center border-r border-neutral-200 pt-8 lg:flex">
        <Brand compact />
        <div className="mt-12">
          <DesktopNavigation workspace={workspace} compact />
        </div>
      </aside>
      <div className="lg:ml-20">
        <MobileHeader />
        <header className="hidden h-16 items-center border-b border-neutral-100 px-10 text-xs text-neutral-400 lg:flex">
          Personal workspace<span className="mx-3 text-neutral-300">/</span>
          <span className="text-neutral-600 capitalize">{workspace.view}</span>
        </header>
        <main className="mx-auto max-w-4xl px-5 pt-7 pb-52 sm:px-10 lg:pt-10">
          {children}
        </main>
      </div>
      <MobileNavigation workspace={workspace} floating />
    </div>
  );
}

function InsetLayout({ workspace, children }: LayoutProps) {
  return (
    <div className="font-inter min-h-dvh bg-neutral-100 text-neutral-900 lg:p-5">
      <aside className="fixed inset-y-8 left-5 hidden w-52 flex-col px-3 pt-3 lg:flex">
        <div className="px-3">
          <Brand />
        </div>
        <div className="mt-10">
          <DesktopNavigation workspace={workspace} />
        </div>
        <CollectionShortcuts workspace={workspace} />
        <a
          href="/playground"
          className="mt-auto flex min-h-11 items-center gap-1 px-3 text-xs text-neutral-500"
        >
          Playground
          <ArrowUpRight className="size-3" />
        </a>
      </aside>
      <div className="min-h-dvh bg-white lg:ml-56 lg:min-h-[calc(100dvh-2.5rem)] lg:rounded-2xl lg:border lg:border-neutral-200">
        <MobileHeader />
        <main className="mx-auto max-w-6xl px-5 pt-7 pb-48 sm:px-8 lg:pt-10">
          {children}
        </main>
      </div>
      <MobileNavigation workspace={workspace} />
    </div>
  );
}

function ExpenseTable({ workspace }: PrototypeProps) {
  if (!workspace.filteredExpenses.length)
    return <EmptyExpenses workspace={workspace} />;
  const collectionNames = new Map(
    workspace.collections.map((collection) => [collection.id, collection.name]),
  );
  return (
    <>
      <div className="hidden grid-cols-12 gap-4 border-y border-neutral-200 py-3 text-xs text-neutral-500 md:grid">
        <span className="col-span-5">Expense</span>
        <span className="col-span-2">Date</span>
        <span className="col-span-3">Collection</span>
        <span className="col-span-2 text-right">Amount</span>
      </div>
      <ul className="divide-y divide-neutral-100">
        {workspace.filteredExpenses.map((expense) => (
          <li key={expense.id}>
            <button
              type="button"
              aria-label={`View ${expense.title}`}
              className="grid w-full cursor-pointer grid-cols-12 items-center gap-3 py-4 text-left hover:bg-neutral-50 md:gap-4"
              onClick={() => workspace.setDialog({ kind: "expense", expense })}
            >
              <span className="col-span-8 min-w-0 md:col-span-5">
                <span className="block truncate text-sm font-medium">
                  {expense.title}
                </span>
                <span className="mt-1.5 block truncate text-xs text-neutral-500">
                  {categories[expense.category].label}
                  <span className="md:hidden">
                    {" "}
                    · {formatDate(expense.date)}
                  </span>
                </span>
              </span>
              <span className="col-span-2 hidden text-xs text-neutral-500 md:block">
                {formatDate(expense.date)}
              </span>
              <span className="col-span-3 hidden truncate text-xs text-neutral-500 md:block">
                {collectionNames.get(expense.collectionId)}
              </span>
              <span className="col-span-4 text-right text-sm whitespace-nowrap tabular-nums md:col-span-2">
                {formatAmount(expense.amount, 2)}
                <span className="ml-1 text-xs text-neutral-400">kr</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

function LedgerContent({ workspace }: PrototypeProps) {
  const isSettings = workspace.view === "settings";
  const isExpenses = workspace.view === "expenses";
  const title = isSettings
    ? "Settings"
    : isExpenses
      ? "Expenses"
      : "Collections";
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h1>
        {!isSettings && (
          <AddAction
            workspace={workspace}
            className="shrink-0 rounded-lg bg-blue-600 px-3 text-xs hover:bg-blue-700 sm:px-4 sm:text-sm"
          />
        )}
      </div>
      {!isSettings && (
        <>
          <div className="mt-7 mb-5 flex flex-wrap items-center gap-2">
            {isExpenses && (
              <ExpenseSearch
                workspace={workspace}
                className="w-full sm:mr-auto sm:w-56"
              />
            )}
            <MonthFilter
              workspace={workspace}
              className="flex-1 sm:flex-none"
            />
            {isExpenses && (
              <CollectionFilter
                workspace={workspace}
                className="w-auto flex-1 sm:flex-none"
              />
            )}
          </div>
          {isExpenses ? (
            <ExpenseTable workspace={workspace} />
          ) : (
            <PrototypeCollectionList workspace={workspace} showTotals={false} />
          )}
          <p className="mt-7 border-t border-neutral-100 pt-5 text-xs text-neutral-400">
            Mock data · changes reset on refresh
          </p>
        </>
      )}
    </>
  );
}

export function LedgerNavigationPrototype({
  workspace,
  variant,
}: {
  workspace: PrototypeWorkspace;
  variant: LedgerVariant;
}) {
  const content = <LedgerContent workspace={workspace} />;
  if (variant === "rail")
    return <RailLayout workspace={workspace}>{content}</RailLayout>;
  if (variant === "inset")
    return <InsetLayout workspace={workspace}>{content}</InsetLayout>;
  return <SidebarLayout workspace={workspace}>{content}</SidebarLayout>;
}
