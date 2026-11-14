import type { AppRouter } from "@ai-expenses/api";
import {
  createTRPCClient,
  httpBatchLink,
  httpLink,
  httpSubscriptionLink,
  isNonJsonSerializable,
  splitLink,
} from "@trpc/client";
import {
  createTRPCOptionsProxy,
  type TRPCOptionsProxy,
} from "@trpc/tanstack-react-query";
import superjson from "superjson";

import { queryClient } from "./lib/query-client";

const client = createTRPCClient<AppRouter>({
  links: [
    splitLink({
      condition: (operation) => operation.type === "subscription",
      true: httpSubscriptionLink({ url: "/trpc", transformer: superjson }),
      false: splitLink({
        condition: (operation) => isNonJsonSerializable(operation.input),
        true: httpLink({ url: "/trpc", transformer: superjson }),
        false: httpBatchLink({ url: "/trpc", transformer: superjson }),
      }),
    }),
  ],
});

export const trpc = createTRPCOptionsProxy<AppRouter>({ client, queryClient });

export type TRPC = TRPCOptionsProxy<AppRouter>;
