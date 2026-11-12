import { PageHeader } from "../../components/PageHeader";
import { ExpenseHistory } from "./ExpenseHistory";
import {
  AddAction,
  CollectionFilter,
  EmptyExpenses,
  ExpenseSearch,
  MonthFilter,
  PrototypeCollectionList,
  type PrototypeProps,
} from "./PrototypeControls";

function ExpenseEntries({ workspace }: PrototypeProps) {
  if (!workspace.filteredExpenses.length)
    return <EmptyExpenses workspace={workspace} />;
  return (
    <ExpenseHistory
      expenses={workspace.filteredExpenses}
      collections={workspace.collections}
      onSelectExpense={(expense) =>
        workspace.setDialog({ kind: "expense", expense })
      }
    />
  );
}

export function LedgerContent({ workspace }: PrototypeProps) {
  const isSettings = workspace.view === "settings";
  const isExpenses = workspace.view === "expenses";
  const title = isSettings
    ? "Settings"
    : isExpenses
      ? "Expenses"
      : "Collections";
  return (
    <>
      <PageHeader
        title={title}
        action={
          !isSettings && (
            <AddAction
              workspace={workspace}
              className="shrink-0 rounded-lg bg-blue-600 px-3 text-xs hover:bg-blue-700 sm:px-4 sm:text-sm"
            />
          )
        }
      />
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
            <ExpenseEntries workspace={workspace} />
          ) : (
            <PrototypeCollectionList workspace={workspace} />
          )}
          <p className="mt-7 border-t border-neutral-100 pt-5 text-xs text-neutral-400">
            Mock data · changes reset on refresh
          </p>
        </>
      )}
    </>
  );
}
