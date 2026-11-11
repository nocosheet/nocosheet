import { createFileRoute } from "@tanstack/react-router";

import { WorkspaceContent, WorkspaceHeader } from "@/components/layout/workspace-header";
import { CreateRoleDialog } from "@/components/workspace/settings/roles/create-role-dialog";
import { RolesList } from "@/components/workspace/settings/roles/roles-list";
import { rolesQueryOptions } from "@/data/workspace/roles";

export const Route = createFileRoute("/w/$workspace/settings/members/roles/")({
  loader: ({ context, params }) => context.queryClient.query(rolesQueryOptions(params.workspace)),
  component: RolesPage,
});

function RolesPage() {
  const { workspace } = Route.useParams();

  return (
    <>
      <WorkspaceHeader workspace={workspace}>
        <CreateRoleDialog workspace={workspace} />
      </WorkspaceHeader>
      <WorkspaceContent className="max-w-3xl">
        <RolesList workspace={workspace} />
      </WorkspaceContent>
    </>
  );
}
