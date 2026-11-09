import { mutationOptions } from "@tanstack/react-query";

import { auth } from "@/lib/auth-client";

import { unwrapAuthResult } from "./auth-error";
import { authKeys } from "./keys";

export const disableTwoFactorMutationOptions = mutationOptions({
  mutationKey: authKeys.mutation("disable-two-factor"),
  mutationFn: async (values: { password: string }) =>
    unwrapAuthResult(await auth.twoFactor.disable(values)),
});
