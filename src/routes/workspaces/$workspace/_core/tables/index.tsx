import { createFileRoute, Link } from "@tanstack/react-router";

import { PlusIcon, Trash2Icon } from "lucide-react";

import { WorkspaceContent, WorkspaceHeader } from "@/components/layout/workspace-header";
import { Button } from "@/components/ui/button";
import { TablesEmpty } from "@/components/workspace/tables-empty";
import { TablesTable } from "@/components/workspace/tables/tables-table";
import { tablesQueryOptions } from "@/data/workspace/tables";
import { useWorkspace } from "@/hooks/use-workspace";
import { resolveTablesQuery, validateTablesSearch } from "@/lib/tables/query";

export const Route = createFileRoute("/workspaces/$workspace/_core/tables/")({
  validateSearch: validateTablesSearch,
  loaderDeps: ({ search }) => resolveTablesQuery(search),
  loader: ({ context, deps, params }) =>
    context.queryClient.query(tablesQueryOptions(params.workspace, deps)),
  component: TablesPage,
});

function TablesPage() {
  const { workspace } = Route.useParams();
  const { isAdmin } = useWorkspace();

  return (
    <>
      <WorkspaceHeader workspace={workspace}>
        {isAdmin && (
          <Button
            size="sm"
            variant="outline"
            render={<Link to="/workspaces/$workspace/tables/trash" params={{ workspace }} />}
          >
            <Trash2Icon />
            Trash
          </Button>
        )}
        <Button
          size="sm"
          render={
            <Link to="/workspaces/$workspace/tables/new" params={{ workspace }} search={{ step: 1 }} />
          }
        >
          <PlusIcon />
          New table
        </Button>
      </WorkspaceHeader>
      <WorkspaceContent>
        <TablesTable
          workspace={workspace}
          empty="No tables match your filters."
          placeholder={<TablesEmpty workspace={workspace} />}
        />
      </WorkspaceContent>
    </>
  );
}
