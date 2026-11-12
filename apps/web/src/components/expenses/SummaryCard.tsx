import type { LucideIcon } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { SectionCard } from "../SectionCard";

export function SummaryCard({
  label,
  value,
  suffix,
  description,
  icon: Icon,
  accent = false,
  className,
}: {
  label: string;
  value: string;
  suffix?: string;
  description: string;
  icon: LucideIcon;
  accent?: boolean;
  className?: string;
}) {
  return (
    <SectionCard
      className={twMerge(
        "p-4 sm:p-6",
        accent && "border-emerald-100 bg-emerald-50/70",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 text-slate-400">
        <h2 className="text-xs font-medium text-slate-600 sm:text-sm">
          {label}
        </h2>
        <Icon className="size-4 sm:size-5" strokeWidth={1.6} />
      </div>
      <p
        className={twMerge(
          "mt-5 text-3xl font-semibold tracking-tight text-slate-900 tabular-nums sm:text-4xl",
          accent && "text-emerald-800",
        )}
      >
        {value}
        {suffix && (
          <span className="ml-1.5 text-sm font-normal tracking-normal text-slate-400">
            {suffix}
          </span>
        )}
      </p>
      <p className="mt-3 text-xs leading-relaxed text-slate-500">
        {description}
      </p>
    </SectionCard>
  );
}
