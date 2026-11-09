import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { useRefreshSession } from "@/data/auth/session-refresh";
import { signOutMutationOptions } from "@/data/auth/sign-out";

/** Signs out, clears user-scoped cache, and returns to the sign-in page. */
export function useSignOut() {
  const navigate = useNavigate();
  const refreshSession = useRefreshSession();

  return useMutation({
    ...signOutMutationOptions,
    onSuccess: async () => {
      await refreshSession({ signedOut: true });
      await navigate({ to: "/auth/sign-in" });
    },
  });
}
