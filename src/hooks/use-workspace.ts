import { useRouteContext } from "@tanstack/react-router";

export function useWorkspace() {
  return useRouteContext({ from: "/w/$workspace", select: (context) => context.workspace });
}
