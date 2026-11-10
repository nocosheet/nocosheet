import { mutationOptions } from "@tanstack/react-query";

import { auth } from "@/lib/auth/client";

import { unwrapAuthResult } from "./auth-error";
import { authKeys } from "./keys";

export const updateUserMutationOptions = mutationOptions({
  mutationKey: authKeys.mutation("update-user"),
  mutationFn: async (values: { name?: string; image?: string | null }) =>
    unwrapAuthResult(await auth.updateUser(values)),
});
