import { createFileRoute, Navigate } from "@tanstack/react-router";

import { WorkspaceContent, WorkspaceHeader } from "@/components/layout/workspace-header";
import { ViewsTrash } from "@/components/workspace/views/views-trash";
import { deletedViewsQueryOptions } from "@/data/workspace/views";
import { useWorkspace } from "@/hooks/use-workspace";
import { resolveTrashQuery, validateTrashSearch } from "@/lib/trash/query";

export const Route = createFileRoute("/workspaces/$workspace/_core/tables/$table/views/trash")({
  staticData: { crumb: "Deleted views" },
  validateSearch: validateTrashSearch,
  loaderDeps: ({ search }) => resolveTrashQuery(search),
  loader: ({ context, deps, params }) => {
    void context.queryClient
      .query(deletedViewsQueryOptions(params.workspace, Number(params.table), deps))
      .catch(() => undefined);
  },
  component: ViewsTrashPage,
});

function ViewsTrashPage() {
  const { workspace, table } = Route.useParams();
  const { isAdmin } = useWorkspace();

  if (!isAdmin)
    return <Navigate to="/workspaces/$workspace/tables/$table" params={{ workspace, table }} replace />;

  return (
    <>
      <WorkspaceHeader workspace={workspace} />
      <WorkspaceContent className="max-w-3xl">
        <ViewsTrash workspace={workspace} tableId={Number(table)} />
      </WorkspaceContent>
    </>
  );
}
