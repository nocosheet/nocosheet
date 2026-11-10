import { mutationOptions } from "@tanstack/react-query";

import { unwrapAuthResult } from "@/data/auth/auth-error";
import { auth } from "@/lib/auth/client";

import { adminKeys } from "./keys";

export const banUserMutationOptions = mutationOptions({
  mutationKey: adminKeys.mutation("ban-user"),
  mutationFn: async (values: { userId: string; banReason?: string; banExpiresIn?: number }) =>
    unwrapAuthResult(await auth.admin.banUser(values)),
});
