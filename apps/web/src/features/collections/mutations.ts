import { useMutation, useQueryClient } from "@tanstack/react-query";
import { trpc } from "../../trpc";

export function useCreateCollection() {
  const queryClient = useQueryClient();

  return useMutation(
    trpc.collections.create.mutationOptions({
      onSuccess: (created) => {
        const queryKey = trpc.collections.list.queryKey();

        queryClient.setQueryData(queryKey, (collections) =>
          collections ? [...collections, created] : undefined,
        );

        return queryClient.invalidateQueries({ queryKey });
      },
    }),
  );
}

export function useUpdateCollection() {
  const queryClient = useQueryClient();

  return useMutation(
    trpc.collections.update.mutationOptions({
      onSuccess: (updated) => {
        const queryKey = trpc.collections.list.queryKey();

        queryClient.setQueryData(queryKey, (collections) =>
          collections?.map((c) => (c.id === updated.id ? updated : c)),
        );

        return queryClient.invalidateQueries({ queryKey });
      },
    }),
  );
}

export function useDeleteCollection() {
  const queryClient = useQueryClient();

  return useMutation(
    trpc.collections.delete.mutationOptions({
      onSuccess: (deleted) => {
        const queryKey = trpc.collections.list.queryKey();

        queryClient.setQueryData(queryKey, (collections) =>
          collections?.filter((collection) => collection.id !== deleted.id),
        );

        return queryClient.invalidateQueries({ queryKey });
      },
    }),
  );
}
