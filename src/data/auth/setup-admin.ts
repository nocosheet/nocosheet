import { mutationOptions } from "@tanstack/react-query";

import { fetch } from "void/client";

import { auth } from "@/lib/auth-client";

import { unwrapAuthResult } from "./auth-error";
import { authKeys } from "./keys";

export const setupAdminMutationOptions = mutationOptions({
  mutationKey: authKeys.mutation("setup-admin"),
  mutationFn: async (values: { name: string; email: string; password: string }) => {
    await fetch("/api/setup", { method: "POST", body: values });
    return unwrapAuthResult(
      await auth.signIn.email({ email: values.email, password: values.password }),
    );
  },
});
