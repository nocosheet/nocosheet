import { createFileRoute, Link } from "@tanstack/react-router";

import { PlusIcon } from "lucide-react";

import { WorkspaceContent, WorkspaceHeader } from "@/components/layout/workspace-header";
import { Button } from "@/components/ui/button";
import { TablesEmpty } from "@/components/workspace/tables-empty";

export const Route = createFileRoute("/w/$workspace/_app/tables/")({
  component: TablesPage,
});

function TablesPage() {
  const { workspace } = Route.useParams();
  return (
    <>
      <WorkspaceHeader workspace={workspace}>
        <Button
          size="sm"
          render={
            <Link to="/w/$workspace/tables/new" params={{ workspace }} search={{ step: 1 }} />
          }
        >
          <PlusIcon />
          New table
        </Button>
      </WorkspaceHeader>
      <WorkspaceContent>
        <TablesEmpty workspace={workspace} />
      </WorkspaceContent>
    </>
  );
}
