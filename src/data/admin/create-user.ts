import { mutationOptions } from "@tanstack/react-query";

import { unwrapAuthResult } from "@/data/auth/auth-error";
import { auth } from "@/lib/auth-client";

import { adminKeys } from "./keys";

export const createUserMutationOptions = mutationOptions({
  mutationKey: adminKeys.mutation("create-user"),
  mutationFn: async (values: {
    name: string;
    email: string;
    password: string;
    role: "admin" | "user";
    emailVerified: boolean;
  }) =>
    unwrapAuthResult(
      await auth.admin.createUser({
        name: values.name,
        email: values.email,
        password: values.password,
        role: values.role,
        data: { emailVerified: values.emailVerified },
      }),
    ),
});
