import { queryOptions } from "@tanstack/react-query";

import { fetch } from "void/client";

import { unwrapFetch } from "./api-error";
import { workspaceKeys } from "./keys";

export const sidebarQueryOptions = (workspace: string) =>
  queryOptions({
    queryKey: workspaceKeys.sidebar(),
    queryFn: () => unwrapFetch(fetch("/api/w/:workspace/sidebar", { params: { workspace } })),
    staleTime: 30_000,
  });
