// The inset mock workspace hosts floating-dock, pending-row, and hold-animation studies.
import { useCallback, useEffect, useState } from "react";
import { WorkspaceDialogs } from "../../components/expenses/WorkspaceDialogs";
import { useExpenseWorkspace } from "../../hooks/useExpenseWorkspace";
import { type DockVariant, dockVariants } from "./FloatingCaptureDock";
import { HomeCapturePrototype } from "./HomeCapturePrototype";
import { InsetWorkspace } from "./InsetWorkspace";
import { LedgerContent } from "./LedgerContent";
import {
  type ManualEntryVariant,
  manualEntryVariants,
} from "./ManualExpenseAction";
import { type PendingVariant, pendingVariants } from "./PendingExpenseRow";
import { PendingExpenseStudy } from "./PendingExpenseStudy";
import { PrototypeSwitcher, type VariantOption } from "./PrototypeControls";
import {
  RecordingButtonStudy,
  type RecordingVariant,
  recordingVariants,
} from "./RecordingButtonStudy";

type StudyVariant =
  | DockVariant
  | PendingVariant
  | RecordingVariant
  | ManualEntryVariant;
const pathname = window.location.pathname.replace(/\/$/, "");
const isPendingStudy = pathname === "/prototypes/pending-expense";
const isRecordingStudy = pathname === "/prototypes/recording";
const isManualStudy = pathname === "/prototypes/manual-entry";
const variants: VariantOption<StudyVariant>[] = isPendingStudy
  ? pendingVariants
  : isRecordingStudy
    ? recordingVariants
    : isManualStudy
      ? manualEntryVariants
      : dockVariants;

function readVariant(): StudyVariant {
  const value = new URLSearchParams(window.location.search).get("variant");
  return (
    variants.find((variant) => variant.id === value)?.id ??
    (isPendingStudy
      ? "quiet"
      : isRecordingStudy
        ? "pulse"
        : isManualStudy
          ? "header"
          : "panel")
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
      <InsetWorkspace workspace={workspace} capture>
        {isPendingStudy && workspace.view === "expenses" ? (
          <PendingExpenseStudy
            workspace={workspace}
            variant={
              variant === "progress" || variant === "receipt"
                ? variant
                : "quiet"
            }
          />
        ) : isRecordingStudy && workspace.view === "home" ? (
          <RecordingButtonStudy
            key={variant}
            variant={
              variant === "wave" || variant === "glass" ? variant : "pulse"
            }
          />
        ) : workspace.view === "home" ? (
          <HomeCapturePrototype
            workspace={workspace}
            manualVariant={
              isManualStudy
                ? variant === "floating" || variant === "dock"
                  ? variant
                  : "header"
                : "dock"
            }
            variant={
              variant === "split" || variant === "sidecar" ? variant : "panel"
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
