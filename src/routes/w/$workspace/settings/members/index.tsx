import { createFileRoute } from "@tanstack/react-router";

import { WorkspaceContent, WorkspaceHeader } from "@/components/layout/workspace-header";
import { AddMemberDialog } from "@/components/workspace/member-admin/add-member-dialog";
import { MembersList } from "@/components/workspace/members-list";
import { isAdmin } from "@/lib/auth/access";

export const Route = createFileRoute("/w/$workspace/settings/members/")({
  component: MembersPage,
});

function MembersPage() {
  const { workspace } = Route.useParams();
  const { session } = Route.useRouteContext();

  return (
    <>
      <WorkspaceHeader workspace={workspace}>
        {isAdmin(session?.user) && <AddMemberDialog />}
      </WorkspaceHeader>
      <WorkspaceContent className="max-w-3xl">
        <MembersList workspace={workspace} />
      </WorkspaceContent>
    </>
  );
}
