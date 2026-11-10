import { mutationOptions } from "@tanstack/react-query";

import { fetch } from "void/client";

import { authKeys } from "./keys";

export const uploadAvatarMutationOptions = mutationOptions({
  mutationKey: authKeys.mutation("upload-avatar"),
  mutationFn: async (file: File) => {
    const body = new FormData();
    body.set("file", file);
    return fetch("/api/avatar", { method: "POST", body });
  },
});
