import { mutationOptions } from "@tanstack/react-query";

import { unwrapAuthResult } from "@/data/auth/auth-error";
import { auth } from "@/lib/auth-client";

import { adminKeys } from "./keys";

export const stopImpersonatingMutationOptions = mutationOptions({
  mutationKey: adminKeys.mutation("stop-impersonating"),
  mutationFn: async () => unwrapAuthResult(await auth.admin.stopImpersonating()),
});
