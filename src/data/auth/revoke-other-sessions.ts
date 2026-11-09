import { mutationOptions } from "@tanstack/react-query";

import { auth } from "@/lib/auth-client";

import { unwrapAuthResult } from "./auth-error";
import { authKeys } from "./keys";

export const revokeOtherSessionsMutationOptions = mutationOptions({
  mutationKey: authKeys.mutation("revoke-other-sessions"),
  mutationFn: async () => unwrapAuthResult(await auth.revokeOtherSessions()),
});
