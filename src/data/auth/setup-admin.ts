import { mutationOptions } from "@tanstack/react-query";

import { auth } from "@/lib/auth-client";

import { unwrapAuthResult } from "./auth-error";
import { authKeys } from "./keys";

export const setupAdminMutationOptions = mutationOptions({
  mutationKey: authKeys.mutation("setup-admin"),
  // The server makes the first account an admin; we only create it and sign in.
  mutationFn: async (values: { name: string; email: string; password: string }) => {
    unwrapAuthResult(await auth.signUp.email(values));
    return unwrapAuthResult(
      await auth.signIn.email({ email: values.email, password: values.password }),
    );
  },
});
