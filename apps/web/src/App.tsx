import { Playground } from "./pages/Playground";
import { ExpensePrototypePage } from "./pages/prototypes/ExpensePrototypePage";

export function App() {
  if (window.location.pathname.replace(/\/$/, "") === "/playground") {
    return <Playground />;
  }

  return <ExpensePrototypePage />;
}
