import { mutationOptions } from "@tanstack/react-query";

import { unwrapAuthResult } from "@/data/auth/auth-error";
import { auth } from "@/lib/auth/client";

import { adminKeys } from "./keys";

export const revokeUserSessionMutationOptions = mutationOptions({
  mutationKey: adminKeys.mutation("revoke-user-session"),
  mutationFn: async (values: { sessionToken: string }) =>
    unwrapAuthResult(await auth.admin.revokeUserSession(values)),
});
