import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

export function PageHeader({
  title,
  action,
  className,
}: {
  title: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={twMerge(
        "flex min-h-11 shrink-0 items-start justify-between gap-3",
        className,
      )}
    >
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        {title}
      </h1>
      {action}
    </header>
  );
}
