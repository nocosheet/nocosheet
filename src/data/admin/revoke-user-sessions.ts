import { mutationOptions } from "@tanstack/react-query";

import { unwrapAuthResult } from "@/data/auth/auth-error";
import { auth } from "@/lib/auth/client";

import { adminKeys } from "./keys";

export const revokeUserSessionsMutationOptions = mutationOptions({
  mutationKey: adminKeys.mutation("revoke-user-sessions"),
  mutationFn: async (values: { userId: string }) =>
    unwrapAuthResult(await auth.admin.revokeUserSessions(values)),
});
