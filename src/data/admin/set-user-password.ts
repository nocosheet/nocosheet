import { mutationOptions } from "@tanstack/react-query";

import { unwrapAuthResult } from "@/data/auth/auth-error";
import { auth } from "@/lib/auth-client";

import { adminKeys } from "./keys";

export const setUserPasswordMutationOptions = mutationOptions({
  mutationKey: adminKeys.mutation("set-user-password"),
  mutationFn: async (values: { userId: string; newPassword: string }) =>
    unwrapAuthResult(await auth.admin.setUserPassword(values)),
});
