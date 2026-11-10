import { mutationOptions } from "@tanstack/react-query";

import { unwrapAuthResult } from "@/data/auth/auth-error";
import { auth } from "@/lib/auth/client";

import { adminKeys } from "./keys";

export const removeUserMutationOptions = mutationOptions({
  mutationKey: adminKeys.mutation("remove-user"),
  mutationFn: async (values: { userId: string }) =>
    unwrapAuthResult(await auth.admin.removeUser(values)),
});
