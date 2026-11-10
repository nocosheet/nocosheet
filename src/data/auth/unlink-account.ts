import { mutationOptions } from "@tanstack/react-query";

import { auth } from "@/lib/auth/client";

import { unwrapAuthResult } from "./auth-error";
import { authKeys } from "./keys";

export const unlinkAccountMutationOptions = mutationOptions({
  mutationKey: authKeys.mutation("unlink-account"),
  mutationFn: async (values: { accountId: string }) =>
    unwrapAuthResult(await auth.unlinkAccount(values)),
});
