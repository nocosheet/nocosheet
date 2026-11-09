import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, useRouteContext } from "@tanstack/react-router";

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
import { adminUserQueryOptions } from "@/data/admin/user";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { formatRelativeTime } from "@/lib/format-relative-time";

import { MemberAccess } from "./member-access";
import { MemberDangerZone } from "./member-danger-zone";
import { MemberProfileForm } from "./member-profile-form";
import { MemberSecurity } from "./member-security";
import { MemberSessions } from "./member-sessions";

/** Everything an admin can do to a member; rendered instead of the read-only view. */
export function MemberAdminDetail({ userId }: { userId: string }) {
  const { session } = useRouteContext({ from: "__root__" });
  const { copyToClipboard, isCopied } = useCopyToClipboard();
  const { data: member } = useSuspenseQuery(adminUserQueryOptions(userId));
  const isSelf = session?.user.id === member.id;

  return (
    <div className="flex flex-col gap-6">
      <MemberProfileForm key={member.updatedAt.toString()} member={member} isSelf={isSelf} />
      <CardFrame>
        <CardFrameHeader>
          <CardFrameTitle>Account</CardFrameTitle>
          <CardFrameDescription>Read-only details about this account.</CardFrameDescription>
        </CardFrameHeader>
        <Card>
          <SettingsRow title="Joined" description="When the account was created.">
            <span className="text-sm" title={new Date(member.createdAt).toLocaleString()}>
              {formatRelativeTime(member.createdAt)}
            </span>
          </SettingsRow>
          <SettingsRow title="Last updated" description="When the account was last changed.">
            <span className="text-sm" title={new Date(member.updatedAt).toLocaleString()}>
              {formatRelativeTime(member.updatedAt)}
            </span>
          </SettingsRow>
          <SettingsRow title="Two-factor" description="Whether an authenticator app is set up.">
            <div>
              <Badge variant={member.twoFactorEnabled ? "success" : "secondary"} size="sm">
                {member.twoFactorEnabled ? "Enabled" : "Off"}
              </Badge>
            </div>
          </SettingsRow>
          <SettingsRow title="User ID" description="Internal identifier.">
            <div className="flex items-center gap-2">
              <code className="truncate font-mono text-xs">{member.id}</code>
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={() => copyToClipboard(member.id)}
              >
                {isCopied ? "Copied" : "Copy"}
              </Button>
            </div>
          </SettingsRow>
        </Card>
      </CardFrame>
      {isSelf ? (
        <Alert variant="info">
          <AlertDescription>
            This is your own account. Manage your password, sessions and two-factor from{" "}
            <Link to="/account" className="underline underline-offset-4">
              Account settings
            </Link>
            .
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <MemberSecurity userId={member.id} />
          <MemberSessions userId={member.id} name={member.name} />
          <MemberAccess userId={member.id} />
          <MemberDangerZone member={member} />
        </>
      )}
    </div>
  );
}
