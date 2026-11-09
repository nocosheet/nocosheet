import { createFileRoute } from "@tanstack/react-router";

import { WorkspaceContent, WorkspaceHeader } from "@/components/layout/workspace-header";
import { TablesEmpty } from "@/components/workspace/tables-empty";

export const Route = createFileRoute("/w/$workspace/_app/tables")({
  staticData: { crumb: "Tables" },
  component: TablesPage,
});

function TablesPage() {
  const { workspace } = Route.useParams();
  return (
    <>
      <WorkspaceHeader workspace={workspace} />
      <WorkspaceContent>
        <TablesEmpty workspace={workspace} />
      </WorkspaceContent>
    </>
  );
}
