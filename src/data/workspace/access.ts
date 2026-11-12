import { queryOptions } from "@tanstack/react-query";

import { fetch } from "void/client";

import { unwrapFetch } from "./api-error";
import { workspaceKeys } from "./keys";

export const accessQueryOptions = (workspace: string) =>
  queryOptions({
    queryKey: workspaceKeys.access(),
    queryFn: () => unwrapFetch(fetch("/api/workspaces/:workspace/access", { params: { workspace } })),
    staleTime: 30_000,
  });
