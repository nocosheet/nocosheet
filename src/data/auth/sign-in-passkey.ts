import { mutationOptions } from "@tanstack/react-query";

import { auth } from "@/lib/auth-client";

import { unwrapAuthResult } from "./auth-error";
import { authKeys } from "./keys";

export const signInPasskeyMutationOptions = mutationOptions({
  mutationKey: authKeys.mutation("sign-in-passkey"),
  /** `autoFill` starts a conditional-UI request that waits for the user to pick a passkey from the input. */
  mutationFn: async (values: { autoFill: boolean }) =>
    unwrapAuthResult(await auth.signIn.passkey(values)),
});
