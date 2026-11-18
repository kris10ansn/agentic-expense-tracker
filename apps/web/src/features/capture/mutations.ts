import {
  type Mutation,
  useMutation,
  useMutationState,
  useQueryClient,
} from "@tanstack/react-query";
import type { ExpenseFormData } from "../../../../api/src/expenses/input";
import { client, trpc } from "../../trpc";

function createFormData(input: ExpenseFormData): FormData {
  const form = new FormData();

  for (const [key, value] of Object.entries(input)) {
    if (Array.isArray(value)) {
      for (const file of value) form.append(key, file);
    } else {
      form.set(key, value);
    }
  }

  return form;
}

export function useStartCapture() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: trpc.captures.start.mutationKey(),
    mutationFn: (input: ExpenseFormData) => {
      const formData = createFormData(input);
      return client.captures.start.mutate(formData);
    },
    onSuccess: (capture) => {
      const capturesKey = trpc.captures.listVisible.queryKey();

      queryClient.setQueryData(capturesKey, (captures) =>
        captures !== undefined ? [...captures, capture] : undefined,
      );

      queryClient.invalidateQueries({ queryKey: capturesKey });
    },
  });
}

export function useDismissCapture() {
  const queryClient = useQueryClient();

  return useMutation(
    trpc.captures.dismiss.mutationOptions({
      onSuccess: async ({ id }) => {
        const queryKey = trpc.captures.listVisible.queryKey();
        await queryClient.cancelQueries({ queryKey });
        queryClient.setQueryData(queryKey, (captures) =>
          captures?.filter((capture) => capture.id !== id),
        );
        void queryClient.invalidateQueries({ queryKey });
      },
    }),
  );
}

export function useSendingCaptures() {
  return useMutationState({
    filters: {
      mutationKey: trpc.captures.start.mutationKey(),
      status: "pending",
    },
    select: (mutation: Mutation<unknown, Error, ExpenseFormData>) =>
      mutation.state.variables,
  });
}
