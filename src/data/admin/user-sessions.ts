import { queryOptions } from "@tanstack/react-query";

import { unwrapAuthResult } from "@/data/auth/auth-error";
import { auth } from "@/lib/auth-client";

import { adminKeys } from "./keys";

export const adminUserSessionsQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: adminKeys.sessions(userId),
    queryFn: async () => {
      const { sessions } = unwrapAuthResult(await auth.admin.listUserSessions({ userId }));
      return sessions;
    },
    staleTime: 10_000,
  });
