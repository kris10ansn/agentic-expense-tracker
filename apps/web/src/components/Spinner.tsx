import { twMerge } from "tailwind-merge";

export const Spinner = ({ className }: { className?: string }) => (
  <div
    className={twMerge(
      "size-3.5 animate-[spin_0.4s_linear_infinite] rounded-full border-[3px] border-gray-300 border-t-gray-800",
      className,
    )}
  />
);
