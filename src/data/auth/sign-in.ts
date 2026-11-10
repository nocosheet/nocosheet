import { mutationOptions } from "@tanstack/react-query";

import { auth } from "@/lib/auth/client";

import { unwrapAuthResult } from "./auth-error";
import { authKeys } from "./keys";

export const signInMutationOptions = mutationOptions({
  mutationKey: authKeys.mutation("sign-in"),
  mutationFn: async (values: { email: string; password: string }) =>
    unwrapAuthResult(await auth.signIn.email(values)),
});
