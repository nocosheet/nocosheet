import { createFileRoute, Navigate } from "@tanstack/react-router";

import { WorkspaceContent, WorkspaceHeader } from "@/components/layout/workspace-header";
import { TablesTrash } from "@/components/workspace/tables/tables-trash";
import { deletedTablesQueryOptions } from "@/data/workspace/tables";
import { useWorkspace } from "@/hooks/use-workspace";
import { resolveTrashQuery, validateTrashSearch } from "@/lib/trash/query";

export const Route = createFileRoute("/w/$workspace/_core/tables/trash")({
  staticData: { crumb: "Trash" },
  validateSearch: validateTrashSearch,
  loaderDeps: ({ search }) => resolveTrashQuery(search),
  loader: ({ context, deps, params }) => {
    void context.queryClient
      .query(deletedTablesQueryOptions(params.workspace, deps))
      .catch(() => undefined);
  },
  component: TablesTrashPage,
});

function TablesTrashPage() {
  const { workspace } = Route.useParams();
  const { isAdmin } = useWorkspace();

  if (!isAdmin) return <Navigate to="/w/$workspace/tables" params={{ workspace }} replace />;

  return (
    <>
      <WorkspaceHeader workspace={workspace} />
      <WorkspaceContent className="max-w-3xl">
        <TablesTrash workspace={workspace} />
      </WorkspaceContent>
    </>
  );
}
