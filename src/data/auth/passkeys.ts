import { queryOptions } from "@tanstack/react-query";

import { auth } from "@/lib/auth/client";

import { unwrapAuthResult } from "./auth-error";
import { authKeys } from "./keys";

export const passkeysQueryOptions = queryOptions({
  queryKey: authKeys.passkeys(),
  queryFn: async () => unwrapAuthResult(await auth.passkey.listUserPasskeys()),
  staleTime: 30_000,
});
