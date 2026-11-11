import { createFileRoute, notFound } from "@tanstack/react-router";

import { WorkspaceContent, WorkspaceHeader } from "@/components/layout/workspace-header";
import { RoleEditor } from "@/components/workspace/settings/roles/role-editor";
import { rolesQueryOptions } from "@/data/workspace/roles";
import { sidebarQueryOptions } from "@/data/workspace/sidebar";

export const Route = createFileRoute("/w/$workspace/settings/members/roles/$roleId")({
  loader: async ({ context, params }) => {
    const [roles] = await Promise.all([
      context.queryClient.query({ ...rolesQueryOptions(params.workspace), staleTime: 0 }),
      context.queryClient.query(sidebarQueryOptions(params.workspace)),
    ]);
    const role = roles.find((item) => item.id === Number(params.roleId));
    if (!role) throw notFound();
    return { roleName: role.name };
  },
  staticData: {
    crumb: (loaderData) => (loaderData as { roleName?: string } | undefined)?.roleName ?? "Role",
  },
  component: RolePage,
});

function RolePage() {
  const { workspace, roleId } = Route.useParams();

  return (
    <>
      <WorkspaceHeader workspace={workspace} />
      <WorkspaceContent className="max-w-3xl">
        <RoleEditor workspace={workspace} roleId={Number(roleId)} />
      </WorkspaceContent>
    </>
  );
}
