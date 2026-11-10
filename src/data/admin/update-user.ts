import { mutationOptions } from "@tanstack/react-query";

import { unwrapAuthResult } from "@/data/auth/auth-error";
import { auth } from "@/lib/auth/client";

import { adminKeys } from "./keys";

export const updateUserMutationOptions = mutationOptions({
  mutationKey: adminKeys.mutation("update-user"),
  mutationFn: async (values: {
    userId: string;
    data: {
      name?: string;
      email?: string;
      emailVerified?: boolean;
      role?: "admin" | "user";
    };
  }) => unwrapAuthResult(await auth.admin.updateUser(values)),
});
