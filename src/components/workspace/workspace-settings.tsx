import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";

import { SettingsRow } from "@/components/shared/settings-row";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardFrame,
  CardFrameDescription,
  CardFrameHeader,
  CardFrameTitle,
} from "@/components/ui/card";
import { membersQueryOptions } from "@/data/workspace/members";
import { isAdmin } from "@/lib/auth/access";
import { DEFAULT_WORKSPACE, DEFAULT_WORKSPACE_NAME } from "@/lib/workspace";

export function WorkspaceSettings() {
  const { data: members } = useSuspenseQuery(membersQueryOptions);
  const { session } = useRouteContext({ from: "__root__" });
  const admin = isAdmin(session?.user);

  return (
    <CardFrame>
      <CardFrameHeader>
        <CardFrameTitle>Workspace</CardFrameTitle>
        <CardFrameDescription>
          This instance has a single workspace shared by everyone who signs up.
        </CardFrameDescription>
      </CardFrameHeader>
      <Card>
        <SettingsRow title="Name" description="How the workspace is labelled in the app.">
          <span className="text-sm">{DEFAULT_WORKSPACE_NAME}</span>
        </SettingsRow>
        <SettingsRow title="Address" description="The workspace's URL segment.">
          <code className="font-mono text-sm">/w/{DEFAULT_WORKSPACE}</code>
        </SettingsRow>
        <SettingsRow title="Members" description="Accounts with access to this workspace.">
          <span className="text-sm">{members.length}</span>
        </SettingsRow>
        <SettingsRow
          title="Your role"
          description="Your access level in this workspace."
          badge={
            <Badge variant={admin ? "info" : "secondary"} size="sm">
              {admin ? "Admin" : "Member"}
            </Badge>
          }
        />
      </Card>
    </CardFrame>
  );
}
