import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { SettingsRow } from "@/components/shared/settings-row";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardFrame,
  CardFrameDescription,
  CardFrameHeader,
  CardFrameTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toastManager } from "@/components/ui/toast";
import { workspaceKeys } from "@/data/workspace/keys";
import {
  assignRoleMutationOptions,
  roleAssignmentsQueryOptions,
  rolesQueryOptions,
} from "@/data/workspace/roles";
import { isAdmin } from "@/lib/auth/access";
import { DEFAULT_WORKSPACE } from "@/lib/workspace";

export function MemberRole({
  userId,
  name,
  role,
}: {
  userId: string;
  name: string;
  role?: string | null;
}) {
  const queryClient = useQueryClient();
  const { data: roles } = useQuery(rolesQueryOptions(DEFAULT_WORKSPACE));
  const { data: assignments } = useQuery(roleAssignmentsQueryOptions(DEFAULT_WORKSPACE));

  const assign = useMutation({
    ...assignRoleMutationOptions,
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: workspaceKeys.roles() }),
        queryClient.invalidateQueries({ queryKey: workspaceKeys.access() }),
      ]);
      const label = roles?.find((item) => item.id === variables.roleId)?.name ?? "the role";
      toastManager.add({ type: "success", title: `${name} is now ${label}` });
    },
    onError: (error) =>
      toastManager.add({
        type: "error",
        title: "Couldn't change the role",
        description: error.message,
      }),
  });

  const admin = isAdmin({ role });
  const items = (roles ?? []).map((item) => ({ value: String(item.id), label: item.name }));
  const current =
    assignments?.find((item) => item.userId === userId)?.roleId ??
    roles?.find((item) => item.isDefault)?.id;

  return (
    <CardFrame>
      <CardFrameHeader>
        <CardFrameTitle>Workspace role</CardFrameTitle>
        <CardFrameDescription>
          What this member can do with records. Administrators ignore roles.
        </CardFrameDescription>
      </CardFrameHeader>
      <Card>
        <SettingsRow
          title="Role"
          description={
            admin
              ? "Administrators have full access to everything."
              : "Change it any time. It applies the next time they load the app."
          }
          badge={
            admin ? (
              <Badge variant="info" size="sm">
                Administrator
              </Badge>
            ) : undefined
          }
        >
          {!admin && (
            <Select
              value={current !== undefined ? String(current) : ""}
              items={items}
              disabled={!roles || assign.isPending}
              onValueChange={(next) =>
                next &&
                assign.mutate({ workspace: DEFAULT_WORKSPACE, userId, roleId: Number(next) })
              }
            >
              <SelectTrigger aria-label="Workspace role">
                <SelectValue placeholder="Loading roles…" />
              </SelectTrigger>
              <SelectPopup>
                {items.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectPopup>
            </Select>
          )}
        </SettingsRow>
      </Card>
    </CardFrame>
  );
}
