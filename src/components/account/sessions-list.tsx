import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";

import { LaptopIcon, SmartphoneIcon } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { revokeOtherSessionsMutationOptions } from "@/data/auth/revoke-other-sessions";
import { revokeSessionMutationOptions } from "@/data/auth/revoke-session";
import { sessionsQueryOptions } from "@/data/auth/sessions";
import { useSignOut } from "@/hooks/use-sign-out";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { parseUserAgent } from "@/lib/user-agent";

type SessionsListProps = {
  currentSessionId: string;
};

export function SessionsList({ currentSessionId }: SessionsListProps) {
  const queryClient = useQueryClient();
  const { data: sessions } = useSuspenseQuery(sessionsQueryOptions);

  const refresh = () => queryClient.invalidateQueries(sessionsQueryOptions);
  const signOut = useSignOut();
  const revokeSession = useMutation({ ...revokeSessionMutationOptions, onSuccess: refresh });
  const revokeOthers = useMutation({ ...revokeOtherSessionsMutationOptions, onSuccess: refresh });

  const error = revokeSession.error ?? revokeOthers.error;
  const hasOthers = sessions.some((session) => session.id !== currentSessionId);

  return (
    <CardFrame>
      <CardFrameHeader>
        <CardFrameTitle>Active Sessions</CardFrameTitle>
        <CardFrameDescription>Devices currently signed in to your account.</CardFrameDescription>
      </CardFrameHeader>
      <Card>
        {sessions.map((session) => {
          const { browser, os, mobile } = parseUserAgent(session.userAgent);
          const Icon = mobile ? SmartphoneIcon : LaptopIcon;
          const current = session.id === currentSessionId;

          return (
            <div key={session.id} className="flex items-center gap-4 p-4 not-last:border-b md:px-6">
              <Icon className="size-5 shrink-0 text-muted-foreground" />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium text-sm">
                    {browser} on {os}
                  </p>
                  {current && (
                    <Badge variant="success" size="sm">
                      This device
                    </Badge>
                  )}
                </div>
                <p className="truncate text-muted-foreground text-sm">
                  {session.ipAddress || "Unknown IP"} · Active{" "}
                  {formatRelativeTime(session.updatedAt)}
                </p>
              </div>
              {current ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  loading={signOut.isPending}
                  onClick={() => signOut.mutate()}
                >
                  Sign out
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  loading={
                    revokeSession.isPending && revokeSession.variables?.token === session.token
                  }
                  onClick={() => revokeSession.mutate({ token: session.token })}
                >
                  Revoke
                </Button>
              )}
            </div>
          );
        })}
      </Card>
      {error && (
        <div className="px-6 pt-4">
          <Alert variant="error">
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        </div>
      )}
      <CardFrameFooter className="flex justify-end">
        <Button
          type="button"
          variant="destructive-outline"
          disabled={!hasOthers}
          loading={revokeOthers.isPending}
          onClick={() => revokeOthers.mutate()}
        >
          Sign out other devices
        </Button>
      </CardFrameFooter>
    </CardFrame>
  );
}
