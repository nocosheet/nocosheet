import { mutationOptions } from "@tanstack/react-query";

import { auth } from "@/lib/auth-client";

import { unwrapAuthResult } from "./auth-error";
import { authKeys } from "./keys";

export const deleteUserMutationOptions = mutationOptions({
  mutationKey: authKeys.mutation("delete-user"),
  mutationFn: async (values: { password?: string }) =>
    unwrapAuthResult(await auth.deleteUser(values)),
});
