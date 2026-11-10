import { mutationOptions } from "@tanstack/react-query";

import { auth } from "@/lib/auth/client";

import { unwrapAuthResult } from "./auth-error";
import { authKeys } from "./keys";

export const socialSignInMutationOptions = mutationOptions({
  mutationKey: authKeys.mutation("social-sign-in"),
  mutationFn: async (values: { provider: "google"; callbackURL?: string }) =>
    unwrapAuthResult(
      await auth.signIn.social({
        ...values,
        errorCallbackURL: "/auth/sign-in",
      }),
    ),
});
