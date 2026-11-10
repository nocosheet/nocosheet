import { mutationOptions } from "@tanstack/react-query";

import { auth } from "@/lib/auth/client";

import { unwrapAuthResult } from "./auth-error";
import { authKeys } from "./keys";

export const deletePasskeyMutationOptions = mutationOptions({
  mutationKey: authKeys.mutation("delete-passkey"),
  mutationFn: async (values: { id: string }) =>
    unwrapAuthResult(await auth.passkey.deletePasskey(values)),
});
