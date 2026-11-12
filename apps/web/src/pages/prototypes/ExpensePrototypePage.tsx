// The chosen floating panel hosts image-receipt and hold-animation studies.
import { useCallback, useEffect, useState } from "react";
import { WorkspaceDialogs } from "../../components/expenses/WorkspaceDialogs";
import { useExpenseWorkspace } from "../../hooks/useExpenseWorkspace";
import {
  ExpenseHistoryStudy,
  type HistoryVariant,
  historyVariants,
} from "./ExpenseHistoryStudy";
import { HomeCapturePrototype } from "./HomeCapturePrototype";
import { InsetWorkspace } from "./InsetWorkspace";
import { LedgerContent } from "./LedgerContent";
import { type PendingVariant, pendingVariants } from "./PendingExpenseRow";
import { PendingExpenseStudy } from "./PendingExpenseStudy";
import { PrototypeSwitcher, type VariantOption } from "./PrototypeControls";
import {
  RecordingButtonStudy,
  type RecordingVariant,
  recordingVariants,
} from "./RecordingButtonStudy";

type StudyVariant = PendingVariant | RecordingVariant | HistoryVariant;
const pathname = window.location.pathname.replace(/\/$/, "");
const isPendingStudy = pathname === "/prototypes/pending-expense";
const isRecordingStudy = pathname === "/prototypes/recording";
const isHistoryStudy = pathname === "/prototypes/expense-history";
const isStudy = isPendingStudy || isRecordingStudy || isHistoryStudy;
const variants: VariantOption<StudyVariant>[] = isPendingStudy
  ? pendingVariants
  : isHistoryStudy
    ? historyVariants
    : recordingVariants;

function readVariant(): StudyVariant {
  const value = new URLSearchParams(window.location.search).get("variant");
  return (
    variants.find((variant) => variant.id === value)?.id ??
    (isPendingStudy ? "receipt" : isHistoryStudy ? "days" : "pulse-wave")
  );
}

export function ExpensePrototypePage() {
  const state = useExpenseWorkspace(isHistoryStudy ? "expenses" : "home");
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
      data-preview={import.meta.env.DEV && isStudy}
    >
      {import.meta.env.DEV && isStudy && (
        <PrototypeSwitcher
          variant={variant}
          variants={variants}
          onChange={changeVariant}
        />
      )}
      <InsetWorkspace workspace={workspace} capture>
        {isHistoryStudy && workspace.view === "expenses" ? (
          <ExpenseHistoryStudy
            workspace={workspace}
            variant={
              historyVariants.find((option) => option.id === variant)?.id ??
              "days"
            }
          />
        ) : workspace.view !== "home" ? (
          <LedgerContent workspace={workspace} />
        ) : isRecordingStudy ? (
          <RecordingButtonStudy
            key={variant}
            variant={
              recordingVariants.find((option) => option.id === variant)?.id ??
              "pulse-wave"
            }
          />
        ) : isPendingStudy ? (
          <HomeCapturePrototype
            workspace={workspace}
            pendingEntry={
              <PendingExpenseStudy
                variant={
                  pendingVariants.find((option) => option.id === variant)?.id ??
                  "receipt"
                }
              />
            }
          />
        ) : (
          <HomeCapturePrototype workspace={workspace} />
        )}
      </InsetWorkspace>
      <WorkspaceDialogs workspace={workspace} showBudgets={false} />
    </div>
  );
}
