import { mutationOptions } from "@tanstack/react-query";

import { auth } from "@/lib/auth-client";

import { unwrapAuthResult } from "./auth-error";
import { authKeys } from "./keys";

export const changePasswordMutationOptions = mutationOptions({
  mutationKey: authKeys.mutation("change-password"),
  mutationFn: async (values: {
    currentPassword: string;
    newPassword: string;
    revokeOtherSessions: boolean;
  }) => unwrapAuthResult(await auth.changePassword(values)),
});
