// Ledger navigation studies on /, selected by ?variant=sidebar|rail|inset.
// Earlier layout studies remain available at ?variant=ledger|pocket|journal.
// Shared mock state keeps edits intact when comparing the layouts.
import { useCallback, useEffect, useState } from "react";
import { WorkspaceDialogs } from "../../components/expenses/WorkspaceDialogs";
import { useExpenseWorkspace } from "../../hooks/useExpenseWorkspace";
import { JournalPrototype } from "./JournalPrototype";
import {
  LedgerNavigationPrototype,
  ledgerVariants,
} from "./LedgerNavigationPrototype";
import { LedgerPrototype } from "./LedgerPrototype";
import { PocketPrototype } from "./PocketPrototype";
import {
  initialVariants,
  PrototypeSwitcher,
  type Variant,
} from "./PrototypeControls";

function readVariant(): Variant {
  const value = new URLSearchParams(window.location.search).get("variant");
  switch (value) {
    case "ledger":
    case "pocket":
    case "journal":
    case "rail":
    case "inset":
      return value;
    default:
      return "sidebar";
  }
}

export function ExpensePrototypePage() {
  const state = useExpenseWorkspace("expenses");
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

  const changeVariant = useCallback((next: Variant) => {
    const url = new URL(window.location.href);
    url.searchParams.set("variant", next);
    window.history.replaceState(null, "", url);
    setVariant(next);
    window.scrollTo({ top: 0 });
  }, []);

  useEffect(() => {
    const onPopState = () => setVariant(readVariant());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const isLedgerStudy =
    variant === "sidebar" || variant === "rail" || variant === "inset";

  return (
    <>
      {isLedgerStudy && (
        <LedgerNavigationPrototype workspace={workspace} variant={variant} />
      )}
      {variant === "ledger" && <LedgerPrototype workspace={workspace} />}
      {variant === "pocket" && <PocketPrototype workspace={workspace} />}
      {variant === "journal" && <JournalPrototype workspace={workspace} />}
      <div className="font-inter">
        <WorkspaceDialogs workspace={workspace} showBudgets={!isLedgerStudy} />
      </div>
      {import.meta.env.DEV && (
        <PrototypeSwitcher
          variant={variant}
          variants={isLedgerStudy ? ledgerVariants : initialVariants}
          onChange={changeVariant}
          className={isLedgerStudy ? "bottom-24 lg:bottom-4" : ""}
        />
      )}
    </>
  );
}
