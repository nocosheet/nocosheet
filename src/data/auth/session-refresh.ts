import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";

import { authKeys } from "@/data/auth/keys";

export function useRefreshSession() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return async ({ signedOut = false } = {}) => {
    if (signedOut) {
      // Drop every cached user-scoped query, but keep the session query so it can be invalidated.
      queryClient.removeQueries({
        predicate: (query) =>
          query.queryKey[0] !== authKeys.all[0] || query.queryKey[1] !== "session",
      });
    }
    await queryClient.invalidateQueries({ queryKey: authKeys.session() });
    await router.invalidate();
  };
}
