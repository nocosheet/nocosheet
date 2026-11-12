import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { SettingsRow } from "@/components/shared/settings-row";
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
import { impersonateUserMutationOptions } from "@/data/admin/impersonate-user";
import { adminKeys } from "@/data/admin/keys";
import { unbanUserMutationOptions } from "@/data/admin/unban-user";
import { adminUserQueryOptions } from "@/data/admin/user";
import { useRefreshSession } from "@/data/auth/session-refresh";
import { workspaceKeys } from "@/data/workspace/keys";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { DEFAULT_WORKSPACE } from "@/lib/workspace";

import { BanMemberDialog } from "./ban-member-dialog";
import { ConfirmAction } from "./confirm-action";

export function MemberAccess({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const refreshSession = useRefreshSession();
  const { data: member } = useSuspenseQuery(adminUserQueryOptions(userId));

  const unbanUser = useMutation({
    ...unbanUserMutationOptions,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminKeys.user(userId) }),
        queryClient.invalidateQueries({ queryKey: workspaceKeys.members() }),
      ]);
      toastManager.add({ type: "success", title: `${member.name} was unbanned` });
    },
    onError: (error) =>
      toastManager.add({ type: "error", title: "Couldn't unban", description: error.message }),
  });

  const impersonate = useMutation({
    ...impersonateUserMutationOptions,
    onSuccess: async () => {
      // Everything cached so far belongs to the admin, so start fresh as the member.
      await refreshSession({ signedOut: true });
      await navigate({ to: "/workspaces/$workspace", params: { workspace: DEFAULT_WORKSPACE } });
    },
    onError: (error) =>
      toastManager.add({
        type: "error",
        title: "Couldn't impersonate",
        description: error.message,
      }),
  });

  const banExpires = member.banExpires ? new Date(member.banExpires) : null;
  // The ban is lifted automatically once it expires.
  const banned = Boolean(member.banned) && (!banExpires || banExpires.getTime() > Date.now());

  return (
    <CardFrame>
      <CardFrameHeader>
        <CardFrameTitle>Access</CardFrameTitle>
        <CardFrameDescription>Suspend this member or see the app as they do.</CardFrameDescription>
      </CardFrameHeader>
      <Card>
        <SettingsRow
          title="Status"
          description={
            banned
              ? `${member.banReason || "No reason given"} · ${
                  banExpires ? `ends ${formatRelativeTime(banExpires)}` : "no end date"
                }`
              : "They can sign in and use the workspace."
          }
          badge={
            <Badge variant={banned ? "error" : "success"} size="sm">
              {banned ? "Banned" : "Active"}
            </Badge>
          }
        >
          {banned ? (
            <Button
              type="button"
              variant="outline"
              className="w-fit"
              loading={unbanUser.isPending}
              onClick={() => unbanUser.mutate({ userId })}
            >
              Unban member
            </Button>
          ) : (
            <BanMemberDialog userId={member.id} name={member.name} />
          )}
        </SettingsRow>
        <SettingsRow
          title="Impersonate"
          description="Sign in as this member for up to an hour to help them or reproduce an issue. You can stop at any time."
        >
          <ConfirmAction
            label="Impersonate member"
            title={`Sign in as ${member.name}?`}
            description="You will see and be able to change everything they can. The session lasts up to one hour, and a banner lets you switch back."
            confirmLabel="Start impersonating"
            disabled={banned}
            pending={impersonate.isPending}
            onConfirm={() => impersonate.mutateAsync({ userId: member.id })}
          />
        </SettingsRow>
      </Card>
    </CardFrame>
  );
}
