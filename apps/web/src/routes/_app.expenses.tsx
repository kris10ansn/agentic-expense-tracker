import { createFileRoute } from "@tanstack/react-router";
import { parseExpenseSearch } from "../features/expenses/search";
import { ExpensesPage } from "../pages/ExpensesPage";

export const Route = createFileRoute("/_app/expenses")({
  validateSearch: parseExpenseSearch,
  component: ExpensesPage,
});
