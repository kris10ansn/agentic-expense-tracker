import type { ComponentProps, ReactNode } from "react";
import { twMerge } from "tailwind-merge";

export function SectionCard({
  className,
  ...props
}: ComponentProps<"section">) {
  return (
    <section
      className={twMerge(
        "min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm",
        className,
      )}
      {...props}
    />
  );
}

export function SectionHeading({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={twMerge(
        "flex items-center justify-between gap-3 p-5 pb-0 sm:p-6 sm:pb-0",
        className,
      )}
    >
      <div>
        <h2 className="text-sm font-semibold tracking-tight text-slate-900">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            {description}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}
