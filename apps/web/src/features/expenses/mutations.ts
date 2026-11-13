import { useMutation, useQueryClient } from "@tanstack/react-query";
import { trpc } from "../../trpc";

export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation(
    trpc.expenses.create.mutationOptions({
      onSuccess: (created) => {
        const queryKey = trpc.expenses.list.queryKey();

        queryClient.setQueryData(queryKey, (expenses) =>
          expenses ? [...expenses, created] : undefined,
        );

        return queryClient.invalidateQueries({ queryKey });
      },
    }),
  );
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation(
    trpc.expenses.update.mutationOptions({
      onSuccess: (updated) => {
        const queryKey = trpc.expenses.list.queryKey();

        queryClient.setQueryData(queryKey, (expenses) =>
          expenses?.map((expense) =>
            expense.id === updated.id ? updated : expense,
          ),
        );

        return queryClient.invalidateQueries({ queryKey });
      },
    }),
  );
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation(
    trpc.expenses.delete.mutationOptions({
      onSuccess: ({ id }) => {
        const queryKey = trpc.expenses.list.queryKey();

        queryClient.setQueryData(queryKey, (expenses) =>
          expenses?.filter((expense) => expense.id !== id),
        );

        return queryClient.invalidateQueries({ queryKey });
      },
    }),
  );
}
