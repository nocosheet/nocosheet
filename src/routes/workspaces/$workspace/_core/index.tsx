import { createFileRoute } from "@tanstack/react-router";

import { WorkspaceContent, WorkspaceHeader } from "@/components/layout/workspace-header";
import { WorkspaceOverview } from "@/components/workspace/workspace-overview";

export const Route = createFileRoute("/workspaces/$workspace/_core/")({
  component: OverviewPage,
});

function OverviewPage() {
  const { workspace } = Route.useParams();
  return (
    <>
      <WorkspaceHeader workspace={workspace} />
      <WorkspaceContent>
        <WorkspaceOverview workspace={workspace} />
      </WorkspaceContent>
    </>
  );
}
