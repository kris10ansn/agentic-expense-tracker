import { ArrowRight, Plus, SquarePen } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { Button } from "../../components/inputs";
import type { VariantOption } from "./PrototypeControls";

export type ManualEntryVariant = "header" | "dock" | "floating";
export const manualEntryVariants: VariantOption<ManualEntryVariant>[] = [
  { id: "header", name: "Top action", description: "Before the expense list" },
  { id: "dock", name: "In the dock", description: "Beside quick capture" },
  {
    id: "floating",
    name: "Floating action",
    description: "Above the recording dock",
  },
];

export function ManualExpenseAction({
  variant,
  onAdd,
  className,
}: {
  variant: ManualEntryVariant;
  onAdd: () => void;
  className?: string;
}) {
  return (
    <Button
      aria-label="Add expense manually"
      onClick={onAdd}
      className={twMerge(
        "gap-2 bg-blue-600 text-sm hover:bg-blue-700",
        variant === "header" && "w-full justify-start rounded-xl px-4 py-3",
        variant === "dock" &&
          "shrink-0 rounded-lg bg-blue-50 px-2 text-xs text-blue-700 hover:bg-blue-100",
        variant === "floating" &&
          "rounded-full px-4 shadow-lg shadow-blue-600/20",
        className,
      )}
    >
      {variant === "dock" ? (
        <SquarePen className="size-4" />
      ) : (
        <Plus className="size-4" />
      )}
      <span>{variant === "dock" ? "Manual" : "Add manually"}</span>
      {variant === "header" && (
        <>
          <span className="ml-auto text-xs text-blue-100">Fill in fields</span>
          <ArrowRight className="size-4" />
        </>
      )}
    </Button>
  );
}
