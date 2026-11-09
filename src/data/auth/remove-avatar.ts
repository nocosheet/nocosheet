import { mutationOptions } from "@tanstack/react-query";

import { fetch } from "void/client";

import { authKeys } from "./keys";

export const removeAvatarMutationOptions = mutationOptions({
  mutationKey: authKeys.mutation("remove-avatar"),
  mutationFn: async () => fetch("/api/account/avatar", { method: "DELETE" }),
});
