import { mutationOptions, queryOptions } from "@tanstack/react-query";

import { fetch } from "void/client";

import type { RoleCreateInput, RoleUpdateInput } from "@/lib/roles/validation";

import { unwrapFetch } from "./api-error";
import { workspaceKeys } from "./keys";

export const rolesQueryOptions = (workspace: string) =>
  queryOptions({
    queryKey: workspaceKeys.roles(),
    queryFn: () => unwrapFetch(fetch("/api/workspaces/:workspace/roles", { params: { workspace } })),
    staleTime: 15_000,
    retry: false,
  });

export const roleAssignmentsQueryOptions = (workspace: string) =>
  queryOptions({
    queryKey: workspaceKeys.roleAssignments(),
    queryFn: () =>
      unwrapFetch(fetch("/api/workspaces/:workspace/roles/assignments", { params: { workspace } })),
    staleTime: 15_000,
    retry: false,
  });

export const createRoleMutationOptions = mutationOptions({
  mutationKey: workspaceKeys.mutation("create-role"),
  mutationFn: ({ workspace, ...body }: { workspace: string } & RoleCreateInput) =>
    unwrapFetch(fetch("/api/workspaces/:workspace/roles", { method: "POST", params: { workspace }, body })),
});

export const updateRoleMutationOptions = mutationOptions({
  mutationKey: workspaceKeys.mutation("update-role"),
  mutationFn: ({
    workspace,
    id,
    values,
  }: {
    workspace: string;
    id: number;
    values: RoleUpdateInput;
  }) =>
    unwrapFetch(
      fetch("/api/workspaces/:workspace/roles/:role", {
        method: "PATCH",
        params: { workspace, role: String(id) },
        body: values,
      }),
    ),
});

export const deleteRoleMutationOptions = mutationOptions({
  mutationKey: workspaceKeys.mutation("delete-role"),
  mutationFn: ({ workspace, id }: { workspace: string; id: number }) =>
    unwrapFetch(
      fetch("/api/workspaces/:workspace/roles/:role", {
        method: "DELETE",
        params: { workspace, role: String(id) },
      }),
    ),
});

export const assignRoleMutationOptions = mutationOptions({
  mutationKey: workspaceKeys.mutation("assign-role"),
  mutationFn: ({
    workspace,
    userId,
    roleId,
  }: {
    workspace: string;
    userId: string;
    roleId: number;
  }) =>
    unwrapFetch(
      fetch("/api/workspaces/:workspace/roles/assignments", {
        method: "PUT",
        params: { workspace },
        body: { userId, roleId },
      }),
    ),
});
