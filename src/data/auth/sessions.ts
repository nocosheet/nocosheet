import { queryOptions } from "@tanstack/react-query";

import { auth } from "@/lib/auth/client";

import { unwrapAuthResult } from "./auth-error";
import { authKeys } from "./keys";

export const sessionsQueryOptions = queryOptions({
  queryKey: authKeys.sessions(),
  queryFn: async () => unwrapAuthResult(await auth.listSessions()),
  staleTime: 30_000,
});
