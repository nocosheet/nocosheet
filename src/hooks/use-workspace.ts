import { useRouteContext } from "@tanstack/react-router";

export function useWorkspace() {
  return useRouteContext({ from: "/workspaces/$workspace", select: (context) => context.workspace });
}
