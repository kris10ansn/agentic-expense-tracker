import { useQueryClient } from "@tanstack/react-query";
import { useSubscription } from "@trpc/tanstack-react-query";
import { LoaderCircle } from "lucide-react";
import { useMemo } from "react";
import { twMerge } from "tailwind-merge";
import type { Capture } from "../../../../api/src/db/schema";
import { trpc } from "../../trpc";

export type PendingExpenseProps = {
  capture: Capture;
  files: File[];
  className?: string;
};
export function PendingExpense({
  capture,
  files,
  className,
}: PendingExpenseProps) {
  const queryClient = useQueryClient();

  const subscription = useSubscription(
    trpc.captures.watch.subscriptionOptions(capture.id, {
      onData: (data) => {
        if (data === undefined) return;

        if (data.capture.status === "complete") {
          const expensesKey = trpc.expenses.list.queryKey();

          if ("createdExpenses" in data) {
            queryClient.setQueryData(expensesKey, (expenses) =>
              expenses !== undefined
                ? [...expenses, ...data.createdExpenses]
                : [],
            );
          }

          queryClient.invalidateQueries({ queryKey: expensesKey });

          const activeCapturesKey = trpc.captures.listActive.queryKey();

          queryClient.setQueryData(activeCapturesKey, (captures) =>
            captures?.filter((c) => c.id !== capture.id),
          );

          queryClient.invalidateQueries({ queryKey: activeCapturesKey });
        }
      },
    }),
  );

  const message = useMemo(() => {
    const data = subscription.data ?? { capture: { status: undefined } };
    const status = data?.capture.status;

    if (status === undefined) return "Sending data...";
    if (status === "extracting") return "Running AI analysis...";
    if (status === "saving") return "Saving new expenses...";
    if (status === "complete") return "Complete!";
    if (status === "failed" && "errorMessage" in data) return data.errorMessage;
    if (status === "failed") return "Failed generating expenses";

    throw new Error(`Illegal status message [${status}]`);
  }, [subscription]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={twMerge(
        "my-3 overflow-hidden rounded-xl border border-neutral-200 text-sm",
        className,
      )}
    >
      <div className="space-y-4 px-4 py-4">
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          {/* <InputIcon aria-hidden="true" className="size-4" /> */}
          <span>Pending entry</span>
          <LoaderCircle
            aria-hidden="true"
            className="ml-auto size-4 shrink-0 text-blue-600 motion-safe:animate-spin"
            strokeWidth={1.75}
          />
        </div>
        {capture.description && (
          <p className="text-base text-pretty text-neutral-900">
            {capture.description}
          </p>
        )}
        {files.length > 0 && <CompactImages images={files} />}
      </div>
      <div className="flex items-center gap-2 border-t border-dashed border-neutral-200 bg-neutral-50 px-4 py-3">
        <p className="text-xs font-medium text-neutral-700">{message}</p>
        <span className="ml-auto text-xs text-neutral-500">Not saved yet</span>
      </div>
    </div>
  );
}

type ImageLayoutProps = { images: File[] };

function CompactImages({ images }: ImageLayoutProps) {
  return (
    <ul className="space-y-3">
      {images.map((image) => (
        <li key={image.name} className="flex min-w-0 items-center gap-3">
          <img
            src={URL.createObjectURL(image)}
            alt={image.name}
            className="size-14 shrink-0 rounded-lg border border-neutral-200 object-cover object-top"
          />
          <div className="min-w-0">
            <p title={image.name} className="truncate text-sm text-neutral-800">
              {image.name}
            </p>
            <p className="mt-1 text-xs text-neutral-500">Uploaded photo</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
