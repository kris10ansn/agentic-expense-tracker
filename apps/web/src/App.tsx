import type { AppRouter } from "@ai-expenses/api";
import {
  type UseQueryResult,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import type { TRPCClientErrorLike } from "@trpc/client";
import type { inferOutput } from "@trpc/tanstack-react-query";
import type React from "react";
import { useState } from "react";
import { ExpenseInput } from "./components/ExpenseInput";
import { type TRPC, trpc } from "./trpc";

export function App() {
  const [value, setValue] = useState("");
  const status = useQuery(
    trpc.status.queryOptions(undefined, { retry: false }),
  );

  const addExpenses = useMutation(trpc.addExpenses.mutationOptions());

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 py-16">
      <SectionCard>
        <h1 className="text-lg font-bold">Output:</h1>

        <pre>{JSON.stringify(addExpenses.data ?? "no-data", null, 4)}</pre>

        <ExpenseInput
          onSubmit={(description: string) => {
            addExpenses.mutate({ description });
          }}
          fetching={addExpenses.isPending}
          value={value}
          setValue={setValue}
        />
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
