import { useRouteContext } from "@tanstack/react-router";

export function useSession() {
  return useRouteContext({ from: "__root__", select: (context) => context.session });
}
