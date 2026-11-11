import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";

import { WorkspaceContent, WorkspaceHeader } from "@/components/layout/workspace-header";
import { TrashList } from "@/components/workspace/records/trash-list";
import { trashQueryOptions } from "@/data/workspace/trash";
import { useWorkspace } from "@/hooks/use-workspace";
import { resolveTrashQuery, validateTrashSearch } from "@/lib/trash/query";

export const Route = createFileRoute("/w/$workspace/_core/tables/$table/trash")({
  staticData: { crumb: "Trash" },
  validateSearch: validateTrashSearch,
  loaderDeps: ({ search }) => resolveTrashQuery(search),
  loader: ({ context, deps, params }) => {
    void context.queryClient
      .query(trashQueryOptions(params.workspace, Number(params.table), deps))
      .catch(() => undefined);
  },
  component: TrashPage,
});

function TrashPage() {
  const { workspace, table } = Route.useParams();
  const { isAdmin } = useWorkspace();

  if (!isAdmin)
    return <Navigate to="/w/$workspace/tables/$table" params={{ workspace, table }} replace />;

  return (
    <>
      <WorkspaceHeader workspace={workspace} />
      <WorkspaceContent className="max-w-3xl">
        <TrashList workspace={workspace} tableId={Number(table)} table={table} />
      </WorkspaceContent>
      <Outlet />
    </>
  );
}
