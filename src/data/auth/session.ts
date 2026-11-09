import { queryOptions } from "@tanstack/react-query";

import { auth } from "@/lib/auth-client";

import { unwrapAuthResult } from "./auth-error";
import { authKeys } from "./keys";

export const sessionQueryOptions = queryOptions({
  queryKey: authKeys.session(),
  queryFn: async () => unwrapAuthResult(await auth.getSession()),
  staleTime: 60_000,
});
