import { X } from "lucide-react";
import { type ReactNode, useId, useLayoutEffect, useRef } from "react";
import { twMerge } from "tailwind-merge";
import { IconButton } from "../inputs";

export function Dialog({
  title,
  description,
  onClose,
  children,
  className,
}: {
  title: string;
  description: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  useLayoutEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <dialog
      ref={ref}
      className={twMerge(
        "fixed inset-x-0 top-auto bottom-0 m-0 max-h-dvh w-full max-w-none overflow-y-auto overscroll-contain rounded-t-3xl border border-slate-200 bg-white px-6 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-slate-900 shadow-xl backdrop:bg-slate-900/30 backdrop:backdrop-blur-sm sm:inset-0 sm:m-auto sm:max-w-lg sm:rounded-2xl sm:p-8",
        className,
      )}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="mx-auto mb-5 h-1 w-9 rounded-full bg-slate-200 sm:hidden" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2
            id={titleId}
            className="text-xl font-semibold tracking-tight wrap-anywhere"
          >
            {title}
          </h2>
          <p
            id={descriptionId}
            className="mt-2 text-sm leading-relaxed text-slate-500"
          >
            {description}
          </p>
        </div>
        <IconButton
          className="-mt-2 -mr-2"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X className="size-5" />
        </IconButton>
      </div>
      {children}
    </dialog>
  );
}

export function DialogActions({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={twMerge(
        "mt-2 flex items-center justify-between gap-3 border-t border-slate-100 pt-5",
        className,
      )}
    >
      {children}
    </div>
  );
}
