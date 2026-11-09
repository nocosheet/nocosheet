import { queryOptions } from "@tanstack/react-query";

import { unwrapAuthResult } from "@/data/auth/auth-error";
import { auth } from "@/lib/auth-client";

import { adminKeys } from "./keys";

/** Full account record (ban state, verification, two-factor); admins only. */
export const adminUserQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: adminKeys.user(userId),
    queryFn: async () => {
      const user = unwrapAuthResult(await auth.admin.getUser({ query: { id: userId } }));
      // Added by the two-factor plugin; the admin client's user type doesn't know about it.
      const { twoFactorEnabled } = user as { twoFactorEnabled?: boolean | null };
      return { ...user, twoFactorEnabled: Boolean(twoFactorEnabled) };
    },
    staleTime: 15_000,
  });
