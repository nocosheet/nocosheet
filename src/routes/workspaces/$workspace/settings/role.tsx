import { createFileRoute } from "@tanstack/react-router";

import { WorkspaceContent, WorkspaceHeader } from "@/components/layout/workspace-header";
import { YourRole } from "@/components/workspace/settings/roles/your-role";
import { sidebarQueryOptions } from "@/data/workspace/sidebar";

export const Route = createFileRoute("/workspaces/$workspace/settings/role")({
  staticData: { crumb: "Role & Permissions" },
  loader: ({ context, params }) => context.queryClient.query(sidebarQueryOptions(params.workspace)),
  component: Page,
});

function Page() {
  const { workspace } = Route.useParams();
  return (
    <>
      <WorkspaceHeader workspace={workspace} />
      <WorkspaceContent className="max-w-3xl">
        <YourRole workspace={workspace} />
      </WorkspaceContent>
    </>
  );
}
