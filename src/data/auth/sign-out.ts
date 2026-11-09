import { mutationOptions } from "@tanstack/react-query";

import { auth } from "@/lib/auth-client";

import { unwrapAuthResult } from "./auth-error";
import { authKeys } from "./keys";

export const signOutMutationOptions = mutationOptions({
  mutationKey: authKeys.mutation("sign-out"),
  mutationFn: async () => unwrapAuthResult(await auth.signOut()),
});
