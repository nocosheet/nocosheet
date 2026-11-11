import { useMemo } from "react";

import { useSuspenseQuery } from "@tanstack/react-query";

import { accessQueryOptions } from "@/data/workspace/access";
import { type Action, scopeOf, type Scope } from "@/lib/roles/permissions";

import { useSession } from "./use-session";
import { useWorkspace } from "./use-workspace";

export function useAccess() {
  const { id: workspace } = useWorkspace();
  const session = useSession();
  const { data } = useSuspenseQuery(accessQueryOptions(workspace));
  const userId = session?.user.id;

  return useMemo(() => {
    const scope = (action: Action, tableId: number): Scope =>
      data.admin ? "all" : scopeOf(data.grants, action, tableId);

    return {
      admin: data.admin,
      role: data.role,
      grants: data.grants,
      scope,
      can: (action: Action, tableId: number) => scope(action, tableId) !== "none",
      canOn: (action: Action, tableId: number, ownerId: string | null | undefined) => {
        const level = scope(action, tableId);
        return level === "all" || (level === "own" && !!userId && ownerId === userId);
      },
    };
  }, [data, userId]);
}
