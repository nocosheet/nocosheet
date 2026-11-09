import { mutationOptions } from "@tanstack/react-query";

import { auth } from "@/lib/auth-client";

import { unwrapAuthResult } from "./auth-error";
import { authKeys } from "./keys";

export const enableTwoFactorMutationOptions = mutationOptions({
  mutationKey: authKeys.mutation("enable-two-factor"),
  mutationFn: async (values: { password: string }) => {
    const result = unwrapAuthResult(await auth.twoFactor.enable({ ...values, method: "totp" }));
    // Only authenticator-app (TOTP) enrollment is supported; narrow the plugin's union.
    if (result.method !== "totp") throw new Error("Unexpected two-factor method");
    return result;
  },
});
