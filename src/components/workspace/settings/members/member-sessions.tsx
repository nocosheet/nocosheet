import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";

import { LaptopIcon, SmartphoneIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardFrame,
  CardFrameDescription,
  CardFrameFooter,
  CardFrameHeader,
  CardFrameTitle,
} from "@/components/ui/card";
import { toastManager } from "@/components/ui/toast";
import { adminKeys } from "@/data/admin/keys";
import { revokeUserSessionMutationOptions } from "@/data/admin/revoke-user-session";
import { revokeUserSessionsMutationOptions } from "@/data/admin/revoke-user-sessions";
import { adminUserSessionsQueryOptions } from "@/data/admin/user-sessions";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { parseUserAgent } from "@/lib/user-agent";

import { ConfirmAction } from "./confirm-action";

export function MemberSessions({ userId, name }: { userId: string; name: string }) {
  const queryClient = useQueryClient();
  const { data: sessions } = useSuspenseQuery(adminUserSessionsQueryOptions(userId));

  const onSuccess = () => queryClient.invalidateQueries({ queryKey: adminKeys.sessions(userId) });
  const onError = (error: Error) =>
    toastManager.add({ type: "error", title: "Couldn't sign out", description: error.message });

  const revokeSession = useMutation({ ...revokeUserSessionMutationOptions, onSuccess, onError });
  const revokeAll = useMutation({
    ...revokeUserSessionsMutationOptions,
    onSuccess: async () => {
      await onSuccess();
      toastManager.add({ type: "success", title: "Signed out everywhere" });
    },
    onError,
  });

  return (
    <CardFrame>
      <CardFrameHeader>
        <CardFrameTitle>Sessions</CardFrameTitle>
        <CardFrameDescription>Devices currently signed in as {name}.</CardFrameDescription>
      </CardFrameHeader>
      <Card>
        {sessions.length === 0 ? (
          <p className="p-6 text-center text-muted-foreground text-sm">No active sessions.</p>
        ) : (
          sessions.map((session) => {
            const { browser, os, mobile } = parseUserAgent(session.userAgent);
            const Icon = mobile ? SmartphoneIcon : LaptopIcon;

            return (
              <div
                key={session.id}
                className="flex items-center gap-4 p-4 not-last:border-b md:px-6"
              >
                <Icon className="size-5 shrink-0 text-muted-foreground" />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium text-sm">
                      {browser} on {os}
                    </p>
                    {session.impersonatedBy && (
                      <Badge variant="warning" size="sm">
                        Impersonated
                      </Badge>
                    )}
                  </div>
                  <p className="truncate text-muted-foreground text-sm">
                    {session.ipAddress || "Unknown IP"} · Active{" "}
                    {formatRelativeTime(session.updatedAt)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  loading={
                    revokeSession.isPending &&
                    revokeSession.variables?.sessionToken === session.token
                  }
                  onClick={() => revokeSession.mutate({ sessionToken: session.token })}
                >
                  Revoke
                </Button>
              </div>
            );
          })
        )}
      </Card>
      <CardFrameFooter className="flex justify-end">
        <ConfirmAction
          label="Sign out everywhere"
          title={`Sign ${name} out everywhere?`}
          description="Every device signed in as this member is signed out immediately."
          confirmLabel="Sign out everywhere"
          destructive
          disabled={sessions.length === 0}
          pending={revokeAll.isPending}
          onConfirm={() => revokeAll.mutateAsync({ userId })}
        />
      </CardFrameFooter>
    </CardFrame>
  );
}
