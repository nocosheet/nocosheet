import { createFileRoute } from "@tanstack/react-router";

import { WorkspaceContent, WorkspaceHeader } from "@/components/layout/workspace-header";
import { AddMemberDialog } from "@/components/workspace/settings/members/add-member-dialog";
import { MembersList } from "@/components/workspace/settings/members/members-list";
import { useWorkspace } from "@/hooks/use-workspace";

export const Route = createFileRoute("/w/$workspace/settings/members/")({
  component: MembersPage,
});

function MembersPage() {
  const { workspace } = Route.useParams();
  const { isAdmin } = useWorkspace();

  return (
    <>
      <WorkspaceHeader workspace={workspace}>{isAdmin && <AddMemberDialog />}</WorkspaceHeader>
      <WorkspaceContent className="max-w-3xl">
        <MembersList workspace={workspace} />
      </WorkspaceContent>
    </>
  );
}
