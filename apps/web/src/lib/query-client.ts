import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { handleAuthenticationError } from "./auth";

export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: handleAuthenticationError }),
  mutationCache: new MutationCache({ onError: handleAuthenticationError }),
});
