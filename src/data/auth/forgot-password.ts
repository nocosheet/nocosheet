import { mutationOptions } from "@tanstack/react-query";

import { auth } from "@/lib/auth-client";

import { unwrapAuthResult } from "./auth-error";
import { authKeys } from "./keys";

export const forgotPasswordMutationOptions = mutationOptions({
  mutationKey: authKeys.mutation("forgot-password"),
  mutationFn: async (values: { email: string }) =>
    unwrapAuthResult(
      await auth.requestPasswordReset({ ...values, redirectTo: "/auth/reset-password" }),
    ),
});
