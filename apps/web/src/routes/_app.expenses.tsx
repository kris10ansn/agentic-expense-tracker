import { createFileRoute } from "@tanstack/react-router";
import { parseExpenseSearch } from "../features/expenses/search";
import { ExpensesPage } from "../pages/ExpensesPage";

export const Route = createFileRoute("/_app/expenses")({
  validateSearch: parseExpenseSearch,
  component: ExpensesRoute,
});

function ExpensesRoute() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <ExpensesPage
      search={search}
      onSearchChange={(search, replace = false) =>
        void navigate({ search, replace, resetScroll: false })
      }
    />
  );
}
