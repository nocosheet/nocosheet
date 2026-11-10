import { mutationOptions } from "@tanstack/react-query";

import { fetch } from "void/client";

import { unwrapFetch } from "./api-error";
import { workspaceKeys } from "./keys";

export const setFavoriteMutationOptions = mutationOptions({
  mutationKey: workspaceKeys.mutation("set-favorite"),
  mutationFn: ({ workspace, id, favorite }: { workspace: string; id: number; favorite: boolean }) =>
    unwrapFetch(
      fetch("/api/w/:workspace/tables/:id/favorite", {
        method: favorite ? "PUT" : "DELETE",
        params: { workspace, id: String(id) },
      }),
    ),
});
