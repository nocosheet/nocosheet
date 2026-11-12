import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { ShieldCheckIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardFrame,
  CardFrameDescription,
  CardFrameHeader,
  CardFrameTitle,
} from "@/components/ui/card";
import { toastManager } from "@/components/ui/toast";
import { ConfirmAction } from "@/components/workspace/settings/members/confirm-action";
import { workspaceKeys } from "@/data/workspace/keys";
import {
  deleteRoleMutationOptions,
  rolesQueryOptions,
  updateRoleMutationOptions,
} from "@/data/workspace/roles";

import { RoleSummary } from "./role-summary";

export function RolesList({ workspace }: { workspace: string }) {
  const queryClient = useQueryClient();
  const { data: roles } = useSuspenseQuery(rolesQueryOptions(workspace));

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: workspaceKeys.roles() }),
      queryClient.invalidateQueries({ queryKey: workspaceKeys.access() }),
    ]);

  const makeDefault = useMutation({
    ...updateRoleMutationOptions,
    onSuccess: async () => {
      await refresh();
      toastManager.add({ type: "success", title: "Default role updated" });
    },
    onError: (error) =>
      toastManager.add({
        type: "error",
        title: "Couldn't change the default",
        description: error.message,
      }),
  });

  const deleteRole = useMutation({
    ...deleteRoleMutationOptions,
    onSuccess: async () => {
      await refresh();
      toastManager.add({ type: "success", title: "Role deleted" });
    },
    onError: (error) =>
      toastManager.add({
        type: "error",
        title: "Couldn't delete the role",
        description: error.message,
      }),
  });

  return (
    <CardFrame>
      <CardFrameHeader>
        <CardFrameTitle>Roles</CardFrameTitle>
        <CardFrameDescription>
          A role decides what a member can do with records. Members without a role get the default
          one.
        </CardFrameDescription>
      </CardFrameHeader>
      <Card>
        <div className="flex items-center justify-between gap-4 p-4 not-last:border-b md:px-6">
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex items-center gap-2">
              <ShieldCheckIcon className="size-4 text-muted-foreground" />
              <span className="font-medium text-sm">Administrator</span>
              <Badge variant="info" size="sm">
                Built-in
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm">
              Full access to everything, including table structure. Roles don't apply to
              administrators.
            </p>
          </div>
        </div>
        {roles.map((role) => (
          <div
            key={role.id}
            className="flex flex-col gap-3 p-4 not-last:border-b md:flex-row md:items-center md:justify-between md:px-6"
          >
            <div className="flex min-w-0 flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to="/workspaces/$workspace/settings/members/roles/$roleId"
                  params={{ workspace, roleId: String(role.id) }}
                  className="font-medium text-sm hover:underline"
                >
                  {role.name}
                </Link>
                {role.isSystem && (
                  <Badge variant="secondary" size="sm">
                    Built-in
                  </Badge>
                )}
                {role.isDefault && (
                  <Badge variant="success" size="sm">
                    Default
                  </Badge>
                )}
                <span className="text-muted-foreground text-xs">
                  {role.memberCount} {role.memberCount === 1 ? "member" : "members"}
                </span>
              </div>
              {role.description && (
                <p className="text-muted-foreground text-sm">{role.description}</p>
              )}
              <RoleSummary grants={role.grants} />
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {!role.isDefault && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  loading={makeDefault.isPending && makeDefault.variables?.id === role.id}
                  onClick={() =>
                    makeDefault.mutate({ workspace, id: role.id, values: { isDefault: true } })
                  }
                >
                  Make default
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                render={
                  <Link
                    to="/workspaces/$workspace/settings/members/roles/$roleId"
                    params={{ workspace, roleId: String(role.id) }}
                  />
                }
              >
                Edit
              </Button>
              {!role.isSystem && !role.isDefault && (
                <ConfirmAction
                  label="Delete"
                  destructive
                  title={`Delete ${role.name}?`}
                  description="Members can't have this role any more. A role that is still assigned can't be deleted."
                  confirmLabel="Delete role"
                  pending={deleteRole.isPending && deleteRole.variables?.id === role.id}
                  onConfirm={() => deleteRole.mutateAsync({ workspace, id: role.id })}
                />
              )}
            </div>
          </div>
        ))}
      </Card>
    </CardFrame>
  );
}
