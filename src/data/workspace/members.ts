import { queryOptions } from "@tanstack/react-query";

import { unwrapAuthResult } from "@/data/auth/auth-error";
import { auth } from "@/lib/auth/client";

import { workspaceKeys } from "./keys";

export const membersQueryOptions = queryOptions({
  queryKey: workspaceKeys.members(),
  queryFn: async () => {
    const { users } = unwrapAuthResult(
      await auth.admin.listUsers({
        query: { limit: 500, sortBy: "name", sortDirection: "asc" },
      }),
    );
    return users;
  },
  staleTime: 30_000,
});
