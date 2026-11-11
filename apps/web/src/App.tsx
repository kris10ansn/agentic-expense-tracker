import {
  useMutation,
  useQuery,
  type UseQueryResult,
} from "@tanstack/react-query";
import { trpc, type TRPC } from "./trpc";
import type { inferOutput } from "@trpc/tanstack-react-query";
import type { AppRouter } from "@ai-expenses/api";
import type { TRPCClientErrorLike } from "@trpc/client";
import type React from "react";

export function App() {
  const status = useQuery(
    trpc.status.queryOptions(undefined, { retry: false }),
  );

  const addExpenses = useMutation(trpc.addExpenses.mutationOptions());

  return (
    <main className="flex flex-col gap-4 min-h-screen items-center justify-center px-6 py-16">
      <SectionCard>
        <form
          className="flex flex-row gap-4"
          action={async (data) => {
            const text = data.get("text");

            if (text !== null) {
              console.log("Sending addExpenses request", { text });
              const response = await addExpenses.mutateAsync({
                description: text.toString(),
              });

              console.log("Got response!", response);
            } else {
              console.error(
                "No text provided",
                Object.fromEntries(data.entries()),
              );
            }
          }}
        >
          <TextInput name="text" placeholder="Describe an expense..." />
          <ButtonInput type="submit" value="Send" />
        </form>
      </SectionCard>
      <StatusCard status={status} />
    </main>
  );
}

type StatusCardProps = {
  status: UseQueryResult<
    inferOutput<TRPC["status"]>,
    TRPCClientErrorLike<AppRouter>
  >;
};

const TextInput = ({
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "className" | "type">) => (
  <input
    type="text"
    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4
           text-sm text-slate-900 shadow-sm placeholder:text-slate-400
           transition-colors hover:border-slate-400
           focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20
           disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60"
    {...props}
  />
);
const ButtonInput = ({
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "className">) => (
  <input
    type={props.type ?? "button"}
    className="inline-flex h-11 items-center justify-center rounded-xl
           bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm
           transition-colors hover:bg-indigo-700 active:bg-indigo-800
           focus-visible:outline-none focus-visible:ring-2
           focus-visible:ring-indigo-500 focus-visible:ring-offset-2
           disabled:pointer-events-none disabled:opacity-50"
    {...props}
  />
);

const StatusCard = ({ status }: StatusCardProps) => (
  <SectionCard>
    <p className="text-sm font-semibold tracking-widest text-emerald-700 uppercase">
      AI Expenses
    </p>
    <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
      {" "}
      Ready to build.{" "}
    </h1>
    <p className="mt-3 leading-7 text-slate-600">Your workspace starts here.</p>

    <div className="mt-8 rounded-xl bg-slate-50 p-5" aria-live="polite">
      <h2 className="text-sm font-medium text-slate-700">Connection status</h2>
      {status.isPending && (
        <p className="mt-2 text-sm text-slate-500">Checking connections…</p>
      )}
      {status.isError && (
        <p className="mt-2 text-sm text-red-700">
          Unable to connect. Check that the API and database are running.
        </p>
      )}
      {status.isSuccess && (
        <dl className="mt-3 space-y-3 text-sm">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-slate-600">API</dt>
            <dd className="font-medium text-emerald-700">{status.data.api}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-slate-600">Database</dt>
            <dd className="font-medium text-emerald-700">
              {status.data.database}
            </dd>
          </div>
        </dl>
      )}
    </div>

    <button
      type="button"
      className="mt-6 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-900 disabled:cursor-wait disabled:opacity-50"
      disabled={status.isFetching}
      onClick={() => void status.refetch()}
    >
      {status.isFetching ? "Checking…" : "Check connection"}
    </button>
  </SectionCard>
);

const SectionCard = ({ children }: React.PropsWithChildren) => (
  <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
    {children}
  </section>
);
