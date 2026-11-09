import { queryOptions } from "@tanstack/react-query";

import { fetch } from "void/client";

import { workspaceKeys } from "./keys";

export const membersQueryOptions = queryOptions({
  queryKey: workspaceKeys.members(),
  queryFn: () => fetch("/api/members"),
  staleTime: 30_000,
});
