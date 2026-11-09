import { mutationOptions } from "@tanstack/react-query";

import { auth } from "@/lib/auth-client";

import { unwrapAuthResult } from "./auth-error";
import { authKeys } from "./keys";

export const signUpMutationOptions = mutationOptions({
  mutationKey: authKeys.mutation("sign-up"),
  mutationFn: async (values: { name: string; email: string; password: string }) =>
    unwrapAuthResult(await auth.signUp.email({ ...values, callbackURL: "/" })),
});
