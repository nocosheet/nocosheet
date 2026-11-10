import { mutationOptions } from "@tanstack/react-query";

import { auth } from "@/lib/auth/client";

import { unwrapAuthResult } from "./auth-error";
import { authKeys } from "./keys";

export const sendVerificationEmailMutationOptions = mutationOptions({
  mutationKey: authKeys.mutation("send-verification-email"),
  mutationFn: async (values: { email: string }) =>
    unwrapAuthResult(await auth.sendVerificationEmail({ ...values, callbackURL: "/" })),
});
