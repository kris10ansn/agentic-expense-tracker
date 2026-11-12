import {
  ArrowDownLeft,
  ArrowRight,
  FolderOpen,
  Plus,
  ReceiptText,
  Wallet,
} from "lucide-react";
import { AppShell } from "../components/expenses/AppShell";
import { BudgetCard } from "../components/expenses/BudgetCard";
import { CollectionList } from "../components/expenses/CollectionList";
import { ExpenseList } from "../components/expenses/ExpenseList";
import { SpendingByCategory } from "../components/expenses/SpendingByCategory";
import { SummaryCard } from "../components/expenses/SummaryCard";
import { WorkspaceDialogs } from "../components/expenses/WorkspaceDialogs";
import { WorkspaceToolbar } from "../components/expenses/WorkspaceToolbar";
import { Button } from "../components/inputs";
import { useExpenseWorkspace } from "../hooks/useExpenseWorkspace";
import { formatAmount } from "../lib/expenses";

const viewCopy = {
  settings: { eyebrow: "", title: "Settings", description: "" },
  overview: {
    eyebrow: "YOUR OVERVIEW",
    title: "Your spending, at a glance.",
    description: "A clear view of the everyday and everything in between.",
  },
  expenses: {
    eyebrow: "YOUR EXPENSES",
    title: "Every expense, in one place.",
    description:
      "The coffee, the groceries, the big plans. Keep track of it all.",
  },
  collections: {
    eyebrow: "YOUR COLLECTIONS",
    title: "A place for every expense.",
    description: "Keep everyday spending and bigger plans neatly together.",
  },
};

export function Dashboard() {
  const workspace = useExpenseWorkspace();
  const {
    view,
    collections,
    selectedMonth,
    selectedCollection,
    availableMonths,
    monthLabel,
    monthlyExpenses,
    visibleExpenses,
    visibleCollections,
    spent,
    budget,
    selectedCollectionName,
    changeView,
    openCollection,
    addExpense,
    setDialog,
    setSelectedMonth,
    setSelectedCollection,
  } = workspace;

  const expenseList = (
    <ExpenseList
      key={`${view}-${selectedCollection}-${selectedMonth}`}
      expenses={visibleExpenses}
      collections={collections}
      preview={view === "overview"}
      onSelect={(expense) => setDialog({ kind: "expense", expense })}
      onViewAll={() => changeView("expenses")}
      onAdd={addExpense}
    />
  );

  return (
    <AppShell
      view={view}
      onViewChange={changeView}
      collections={collections}
      selectedCollection={selectedCollection}
      onCollectionChange={openCollection}
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-3 text-xs font-semibold tracking-widest text-emerald-700">
            {viewCopy[view].eyebrow}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {viewCopy[view].title}
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-500 sm:max-w-none">
            {viewCopy[view].description}
          </p>
        </div>
        <Button
          className="shrink-0 self-start sm:self-center"
          onClick={
            view === "collections"
              ? () => setDialog({ kind: "collection", collection: null })
              : addExpense
          }
        >
          <Plus className="size-4" />
          {view === "collections" || !collections.length
            ? "Create collection"
            : "Add expense"}
        </Button>
      </div>
      <WorkspaceToolbar
        months={availableMonths}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        collections={collections}
        selectedCollection={selectedCollection}
        onCollectionChange={setSelectedCollection}
        showCollections={view !== "collections"}
      />
      {view === "overview" && (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5">
            <SummaryCard
              label="Total spent"
              value={formatAmount(spent)}
              suffix="kr"
              description={`${visibleExpenses.length} expenses in ${monthLabel.split(" ")[0]}`}
              icon={ArrowDownLeft}
            />
            <SummaryCard
              label={budget - spent < 0 ? "Over budget" : "Left to spend"}
              value={formatAmount(Math.abs(budget - spent))}
              suffix="kr"
              description={`Of your ${formatAmount(budget)} kr monthly budget`}
              icon={Wallet}
              accent
            />
            <SummaryCard
              className="hidden sm:block"
              label="Collections"
              value={String(visibleCollections.length).padStart(2, "0")}
              description={
                selectedCollectionName ?? "A place for every part of life"
              }
              icon={FolderOpen}
            />
          </div>
          <div className="grid items-start gap-6 xl:grid-cols-3">
            <div className="min-w-0 xl:col-span-2">
              {expenseList}
              <div className="mt-6 grid grid-cols-[auto_1fr] items-center gap-3 px-1 2xl:flex">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-700">
                  <FolderOpen className="size-5" strokeWidth={1.5} />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs font-medium text-slate-600">
                    A little organization goes a long way.
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">
                    Separate everyday spending from your next big plan.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  className="col-start-2 justify-self-start px-0 text-xs text-emerald-800 hover:bg-transparent"
                  onClick={() => changeView("collections")}
                >
                  Explore collections
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-1">
              <SpendingByCategory expenses={visibleExpenses} />
              <BudgetCard
                spent={spent}
                budget={budget}
                onManage={() => changeView("collections")}
              />
            </div>
          </div>
        </>
      )}
      {view === "expenses" && (
        <>
          <div className="mb-5 flex items-center justify-between gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-2">
              <ReceiptText className="size-4 shrink-0" />
              {selectedCollectionName ?? "All collections"}
            </span>
            <span className="flex flex-wrap justify-end gap-2">
              {visibleExpenses.length} expenses
              <strong className="text-sm font-semibold text-slate-800">
                {formatAmount(spent, 2)} kr
              </strong>
            </span>
          </div>
          {expenseList}
        </>
      )}
      {view === "collections" && (
        <CollectionList
          collections={collections}
          expenses={monthlyExpenses}
          onOpen={openCollection}
          onEdit={(collection) => setDialog({ kind: "collection", collection })}
          onDelete={(collection) =>
            setDialog({ kind: "delete-collection", collection })
          }
          onAdd={() => setDialog({ kind: "collection", collection: null })}
        />
      )}
      <WorkspaceDialogs workspace={workspace} />
    </AppShell>
  );
}
