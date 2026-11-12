import { SquarePen } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { Button } from "../../components/inputs";

export function ManualExpenseAction({
  onAdd,
  className,
}: {
  onAdd: () => void;
  className?: string;
}) {
  return (
    <Button
      aria-label="Add expense manually"
      onClick={onAdd}
      className={twMerge(
        "shrink-0 gap-2 rounded-lg bg-blue-50 px-2 text-xs text-blue-700 hover:bg-blue-100",
        className,
      )}
    >
      <SquarePen className="size-4" />
      <span>Manual</span>
    </Button>
  );
}
