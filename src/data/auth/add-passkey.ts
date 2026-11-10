import { mutationOptions } from "@tanstack/react-query";

import { auth } from "@/lib/auth/client";

import { unwrapAuthResult } from "./auth-error";
import { authKeys } from "./keys";

export const addPasskeyMutationOptions = mutationOptions({
  mutationKey: authKeys.mutation("add-passkey"),
  mutationFn: async (values: { name?: string }) =>
    unwrapAuthResult(await auth.passkey.addPasskey(values)),
});
