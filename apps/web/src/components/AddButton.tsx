import { Plus } from "lucide-react";
import type { ComponentProps } from "react";
import { twMerge } from "tailwind-merge";
import { Button } from "./inputs";

export function AddButton({
  className,
  children,
  ...props
}: ComponentProps<typeof Button>) {
  return (
    <Button
      className={twMerge(
        "shrink-0 rounded-lg bg-blue-600 px-3 text-xs hover:bg-blue-700 sm:px-4 sm:text-sm",
        className,
      )}
      {...props}
    >
      <Plus className="size-4" />
      {children}
    </Button>
  );
}
