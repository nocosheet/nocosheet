import { createFileRoute, Navigate } from "@tanstack/react-router";

import { TrashSheet } from "@/components/workspace/trash/trash-sheet";
import { ViewsTrash } from "@/components/workspace/views/views-trash";
import { deletedViewsQueryOptions } from "@/data/workspace/views";
import { useWorkspace } from "@/hooks/use-workspace";
import { TRASH_RETENTION_DAYS } from "@/lib/records/retention";

export const Route = createFileRoute("/workspaces/$workspace/_core/tables/$table/views/_list/trash")({
  staticData: { crumb: "Deleted views" },
  pendingComponent: () => null,
  loader: ({ context, params }) => {
    void context.queryClient
      .query(deletedViewsQueryOptions(params.workspace, Number(params.table)))
      .catch(() => undefined);
  },
  component: ViewsTrashSheet,
});

function ViewsTrashSheet() {
  const { workspace, table } = Route.useParams();
  const navigate = Route.useNavigate();
  const { isAdmin } = useWorkspace();

  if (!isAdmin)
    return <Navigate to="/workspaces/$workspace/tables/$table" params={{ workspace, table }} replace />;

  return (
    <TrashSheet
      title="Deleted views"
      description={`Deleted views are kept for ${TRASH_RETENTION_DAYS} days.`}
      onClose={() =>
        navigate({ to: "/workspaces/$workspace/tables/$table/views", params: { workspace, table } })
      }
    >
      <ViewsTrash workspace={workspace} tableId={Number(table)} />
    </TrashSheet>
  );
}
