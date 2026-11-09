import { useNavigate } from "@tanstack/react-router";

import { useRefreshSession } from "@/data/auth/session-refresh";

/** Shared finish for every sign-in path: refresh the session, then land on the home page. */
export function useCompleteSignIn() {
  const refreshSession = useRefreshSession();
  const navigate = useNavigate();

  return async () => {
    await refreshSession();
    await navigate({ to: "/" });
  };
}
