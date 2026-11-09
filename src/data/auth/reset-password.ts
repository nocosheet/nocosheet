import { mutationOptions } from "@tanstack/react-query";

import { auth } from "@/lib/auth-client";

import { unwrapAuthResult } from "./auth-error";
import { authKeys } from "./keys";

export const resetPasswordMutationOptions = mutationOptions({
  mutationKey: authKeys.mutation("reset-password"),
  mutationFn: async (values: { token: string; newPassword: string }) =>
    unwrapAuthResult(await auth.resetPassword(values)),
});
