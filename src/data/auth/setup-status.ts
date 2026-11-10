import { queryOptions } from "@tanstack/react-query";

import { fetch } from "void/client";

import { authKeys } from "./keys";

export const setupStatusQueryOptions = queryOptions({
  queryKey: authKeys.setupStatus(),
  queryFn: () => fetch("/api/setup"),
  // Setup only ever flips from pending to done, so a short cache is plenty.
  staleTime: 30_000,
});
