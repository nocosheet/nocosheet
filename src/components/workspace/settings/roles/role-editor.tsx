import { useState } from "react";

import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";

import { SettingsRow } from "@/components/shared/settings-row";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardFrame,
  CardFrameDescription,
  CardFrameHeader,
  CardFrameTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toastManager } from "@/components/ui/toast";
import { workspaceKeys } from "@/data/workspace/keys";
import { rolesQueryOptions, updateRoleMutationOptions } from "@/data/workspace/roles";
import { sidebarQueryOptions } from "@/data/workspace/sidebar";
import { grantsToMatrix, type Matrix, matrixToGrants } from "@/lib/roles/matrix";
import type { PermissionGrant } from "@/lib/roles/permissions";

import { PermissionMatrix } from "./permission-matrix";

export function RoleEditor({ workspace, roleId }: { workspace: string; roleId: number }) {
  const queryClient = useQueryClient();
  const { data: roles } = useSuspenseQuery(rolesQueryOptions(workspace));
  const { data: sidebar } = useSuspenseQuery(sidebarQueryOptions(workspace));
  const role = roles.find((item) => item.id === roleId);

  if (!role)
    return (
      <Alert variant="error">
        <AlertDescription>This role doesn't exist any more.</AlertDescription>
      </Alert>
    );

  return (
    <EditorForm
      key={`${role.id}:${JSON.stringify(role.grants)}:${role.name}:${role.description}`}
      workspace={workspace}
      role={role}
      tables={sidebar.groups.flatMap((group) => group.tables)}
      onSaved={async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: workspaceKeys.roles() }),
          queryClient.invalidateQueries({ queryKey: workspaceKeys.access() }),
        ]);
      }}
    />
  );
}

function EditorForm({
  workspace,
  role,
  tables,
  onSaved,
}: {
  workspace: string;
  role: {
    id: number;
    name: string;
    description: string | null;
    isSystem: boolean;
    isDefault: boolean;
    memberCount: number;
    grants: PermissionGrant[];
  };
  tables: { id: number; name: string; icon: string | null }[];
  onSaved: () => Promise<unknown>;
}) {
  const initialGrants = role.grants;
  const [name, setName] = useState(role.name);
  const [description, setDescription] = useState(role.description ?? "");
  const [isDefault, setIsDefault] = useState(role.isDefault);
  const [matrix, setMatrix] = useState<Matrix>(() => grantsToMatrix(initialGrants));

  const grants = matrixToGrants(matrix);
  const dirty =
    name !== role.name ||
    description !== (role.description ?? "") ||
    isDefault !== role.isDefault ||
    JSON.stringify(grants) !== JSON.stringify(matrixToGrants(grantsToMatrix(initialGrants)));

  const save = useMutation({
    ...updateRoleMutationOptions,
    onSuccess: async () => {
      await onSaved();
      toastManager.add({ type: "success", title: "Role saved" });
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <CardFrame>
        <CardFrameHeader>
          <div className="flex items-center gap-2">
            <CardFrameTitle>{role.name}</CardFrameTitle>
            {role.isSystem && (
              <Badge variant="secondary" size="sm">
                Built-in
              </Badge>
            )}
          </div>
          <CardFrameDescription>
            {role.memberCount} {role.memberCount === 1 ? "member has" : "members have"} this role.
          </CardFrameDescription>
        </CardFrameHeader>
        <Card>
          <SettingsRow
            title="Name"
            description={
              role.isSystem ? "Built-in roles can't be renamed." : "How the role is shown."
            }
          >
            <Input
              aria-label="Role name"
              value={name}
              disabled={role.isSystem}
              onChange={(event) => setName(event.target.value)}
            />
          </SettingsRow>
          <SettingsRow title="Description" description="What this role is for.">
            <Textarea
              aria-label="Role description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </SettingsRow>
          <SettingsRow
            title="Default role"
            description="Given to members who have no role of their own, including new ones."
          >
            <div>
              <Switch
                aria-label="Default role"
                checked={isDefault}
                disabled={role.isDefault}
                onCheckedChange={setIsDefault}
              />
            </div>
          </SettingsRow>
        </Card>
      </CardFrame>

      <PermissionMatrix matrix={matrix} tables={tables} onChange={setMatrix} />

      {save.error && (
        <Alert variant="error">
          <AlertDescription>{save.error.message}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-end gap-2">
        <Button
          variant="ghost"
          disabled={!dirty || save.isPending}
          onClick={() => {
            setName(role.name);
            setDescription(role.description ?? "");
            setIsDefault(role.isDefault);
            setMatrix(grantsToMatrix(initialGrants));
            save.reset();
          }}
        >
          Discard changes
        </Button>
        <Button
          disabled={!dirty || name.trim() === ""}
          loading={save.isPending}
          onClick={() =>
            save.mutate({
              workspace,
              id: role.id,
              values: {
                ...(name.trim() !== role.name ? { name: name.trim() } : {}),
                description: description.trim() || null,
                ...(isDefault && !role.isDefault ? { isDefault: true } : {}),
                grants,
              },
            })
          }
        >
          Save changes
        </Button>
      </div>
    </div>
  );
}
