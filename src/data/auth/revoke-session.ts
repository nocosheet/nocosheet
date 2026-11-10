import { mutationOptions } from "@tanstack/react-query";

import { auth } from "@/lib/auth/client";

import { unwrapAuthResult } from "./auth-error";
import { authKeys } from "./keys";

export const revokeSessionMutationOptions = mutationOptions({
  mutationKey: authKeys.mutation("revoke-session"),
  mutationFn: async (values: { token: string }) =>
    unwrapAuthResult(await auth.revokeSession(values)),
});
