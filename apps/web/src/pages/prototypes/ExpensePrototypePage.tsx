// Three capture layouts on /, selected with ?variant=dock|voice|one-hand.
// The chosen inset shell and mock workspace are shared between the studies.
import { useCallback, useEffect, useState } from "react";
import { WorkspaceDialogs } from "../../components/expenses/WorkspaceDialogs";
import { useExpenseWorkspace } from "../../hooks/useExpenseWorkspace";
import { HomeCapturePrototype } from "./HomeCapturePrototype";
import { InsetWorkspace } from "./InsetWorkspace";
import { LedgerContent } from "./LedgerContent";
import { type PendingVariant, pendingVariants } from "./PendingExpenseRow";
import { PendingExpenseStudy } from "./PendingExpenseStudy";
import {
  captureVariants,
  PrototypeSwitcher,
  type Variant,
} from "./PrototypeControls";

type StudyVariant = Variant | PendingVariant;
const isPendingStudy =
  window.location.pathname.replace(/\/$/, "") === "/prototypes/pending-expense";
const variants = isPendingStudy ? pendingVariants : captureVariants;

function readVariant(): StudyVariant {
  const value = new URLSearchParams(window.location.search).get("variant");
  return (
    variants.find((variant) => variant.id === value)?.id ??
    (isPendingStudy ? "quiet" : "dock")
  );
}

export function ExpensePrototypePage() {
  const state = useExpenseWorkspace(isPendingStudy ? "expenses" : "home");
  const [variant, setVariant] = useState(readVariant);
  const [search, setSearch] = useState("");
  const query = search.trim().toLowerCase();
  const workspace = {
    ...state,
    search,
    setSearch,
    filteredExpenses: state.visibleExpenses.filter((expense) =>
      expense.title.toLowerCase().includes(query),
    ),
  };

  const changeVariant = useCallback((next: StudyVariant) => {
    const url = new URL(window.location.href);
    url.searchParams.set("variant", next);
    window.history.replaceState(null, "", url);
    setVariant(next);
  }, []);

  useEffect(() => {
    const onPopState = () => setVariant(readVariant());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  return (
    <div
      className="expense-prototype font-inter"
      data-preview={import.meta.env.DEV}
    >
      {import.meta.env.DEV && (
        <PrototypeSwitcher
          variant={variant}
          variants={variants}
          onChange={changeVariant}
        />
      )}
      <InsetWorkspace workspace={workspace}>
        {isPendingStudy && workspace.view === "expenses" ? (
          <PendingExpenseStudy
            workspace={workspace}
            variant={
              variant === "progress" || variant === "receipt"
                ? variant
                : "quiet"
            }
          />
        ) : workspace.view === "home" ? (
          <HomeCapturePrototype
            workspace={workspace}
            variant={
              variant === "voice" || variant === "one-hand" ? variant : "dock"
            }
          />
        ) : (
          <LedgerContent workspace={workspace} />
        )}
      </InsetWorkspace>
      <WorkspaceDialogs workspace={workspace} showBudgets={false} />
    </div>
  );
}
