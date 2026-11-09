import { queryOptions } from "@tanstack/react-query";

import { auth } from "@/lib/auth-client";

import { unwrapAuthResult } from "./auth-error";
import { authKeys } from "./keys";

export const accountsQueryOptions = queryOptions({
  queryKey: authKeys.accounts(),
  queryFn: async () => unwrapAuthResult(await auth.listAccounts()),
  staleTime: 30_000,
});
