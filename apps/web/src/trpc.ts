import type { AppRouter } from "@ai-expenses/api";
import { QueryClient } from "@tanstack/react-query";
import {
  createTRPCClient,
  httpBatchLink,
  httpLink,
  isNonJsonSerializable,
  splitLink,
} from "@trpc/client";
import {
  createTRPCOptionsProxy,
  type TRPCOptionsProxy,
} from "@trpc/tanstack-react-query";

export const queryClient = new QueryClient();

const client = createTRPCClient<AppRouter>({
  links: [
    splitLink({
      condition: (operation) => isNonJsonSerializable(operation.input),
      true: httpLink({ url: "/trpc" }),
      false: httpBatchLink({ url: "/trpc" }),
    }),
  ],
});

export const trpc = createTRPCOptionsProxy<AppRouter>({ client, queryClient });

export type TRPC = TRPCOptionsProxy<AppRouter>;
