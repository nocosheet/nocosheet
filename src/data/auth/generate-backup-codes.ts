import { mutationOptions } from "@tanstack/react-query";

import { auth } from "@/lib/auth-client";

import { unwrapAuthResult } from "./auth-error";
import { authKeys } from "./keys";

export const generateBackupCodesMutationOptions = mutationOptions({
  mutationKey: authKeys.mutation("generate-backup-codes"),
  mutationFn: async (values: { password: string }) =>
    unwrapAuthResult(await auth.twoFactor.generateBackupCodes(values)),
});
