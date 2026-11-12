import {
  CalendarDays,
  ChevronDown,
  FolderOpen,
  type LucideIcon,
} from "lucide-react";
import type { ComponentProps } from "react";
import { twMerge } from "tailwind-merge";
import { type Collection, formatMonth } from "../../lib/expenses";
import { Select } from "../inputs";

function FilterSelect({
  icon: Icon,
  className,
  ...props
}: ComponentProps<typeof Select> & { icon: LucideIcon }) {
  return (
    <div className="relative min-w-0 flex-1 sm:flex-none">
      <Icon className="pointer-events-none absolute top-3.5 left-3 z-10 size-4 text-slate-400" />
      <Select
        className={twMerge(
          "appearance-none rounded-lg pr-8 pl-9 text-xs shadow-none sm:text-xs",
          className,
        )}
        {...props}
      />
      <ChevronDown className="pointer-events-none absolute top-4 right-3 size-3 text-slate-400" />
    </div>
  );
}

export function WorkspaceToolbar({
  months,
  selectedMonth,
  onMonthChange,
  collections,
  selectedCollection,
  onCollectionChange,
  showCollections,
}: {
  months: string[];
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  collections: Collection[];
  selectedCollection: string;
  onCollectionChange: (id: string) => void;
  showCollections: boolean;
}) {
  return (
    <div className="my-6 flex flex-wrap items-center gap-2 sm:my-7">
      <FilterSelect
        icon={CalendarDays}
        aria-label="Month"
        value={selectedMonth}
        onChange={(event) => onMonthChange(event.target.value)}
      >
        {months.map((month) => (
          <option key={month} value={month}>
            {formatMonth(month)}
          </option>
        ))}
      </FilterSelect>
      {showCollections && (
        <FilterSelect
          icon={FolderOpen}
          aria-label="Collection"
          value={selectedCollection}
          onChange={(event) => onCollectionChange(event.target.value)}
        >
          <option value="all">All collections</option>
          {collections.map((collection) => (
            <option key={collection.id} value={collection.id}>
              {collection.name}
            </option>
          ))}
        </FilterSelect>
      )}
      <span className="ml-auto hidden text-xs text-slate-400 xl:block">
        {showCollections
          ? "Your money. Your perspective."
          : `${collections.length} collections`}
      </span>
    </div>
  );
}
