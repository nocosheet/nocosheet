import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";

import { SettingsRow } from "@/components/shared/settings-row";
import { RoleBadge } from "@/components/shared/user-badges";
import { UserIdentity } from "@/components/shared/user-identity";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardFrame,
  CardFrameDescription,
  CardFrameHeader,
  CardFrameTitle,
} from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { membersQueryOptions } from "@/data/workspace/members";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { isAdmin } from "@/lib/auth/access";

import { MemberAdminDetail } from "./member-admin/member-admin-detail";

type MemberDetailProps = { userId: string };

export function MemberDetail({ userId }: MemberDetailProps) {
  const { session } = useRouteContext({ from: "__root__" });
  const { copyToClipboard, isCopied } = useCopyToClipboard();
  // The member directory is already loaded for the list, so the detail page just picks from it.
  const { data: member } = useSuspenseQuery({
    ...membersQueryOptions,
    select: (members) => members.find((item) => item.id === userId),
  });

  if (!member) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Member not found</EmptyTitle>
          <EmptyDescription>This account doesn't exist or was removed.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (isAdmin(session?.user)) return <MemberAdminDetail userId={userId} />;

  return (
    <CardFrame>
      <CardFrameHeader>
        <CardFrameTitle>Member</CardFrameTitle>
        <CardFrameDescription>Profile details for this workspace member.</CardFrameDescription>
      </CardFrameHeader>
      <Card>
        <SettingsRow title="Member" description="Name and avatar.">
          <UserIdentity user={member} />
        </SettingsRow>
        <SettingsRow title="Email" description="Primary email address.">
          <a
            href={`mailto:${member.email}`}
            className="truncate text-sm underline-offset-4 hover:underline"
          >
            {member.email}
          </a>
        </SettingsRow>
        <SettingsRow title="Role" description="Their access level in this workspace.">
          <div>
            <RoleBadge user={member} />
          </div>
        </SettingsRow>
        <SettingsRow title="Joined" description="When the account was created.">
          <span className="text-sm" title={new Date(member.createdAt).toLocaleString()}>
            {formatRelativeTime(member.createdAt)}
          </span>
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
  );
}
