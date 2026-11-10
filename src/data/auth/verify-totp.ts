import { mutationOptions } from "@tanstack/react-query";

import { auth } from "@/lib/auth/client";

import { unwrapAuthResult } from "./auth-error";
import { authKeys } from "./keys";

export const verifyTotpMutationOptions = mutationOptions({
  mutationKey: authKeys.mutation("verify-totp"),
  mutationFn: async (values: { code: string; trustDevice?: boolean }) =>
    unwrapAuthResult(await auth.twoFactor.verifyTotp(values)),
});
