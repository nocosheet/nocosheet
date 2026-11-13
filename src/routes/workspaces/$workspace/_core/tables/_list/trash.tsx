import { createFileRoute, Navigate } from "@tanstack/react-router";

import { TrashSheet } from "@/components/workspace/trash/trash-sheet";
import { TablesTrash } from "@/components/workspace/tables/tables-trash";
import { deletedTablesQueryOptions } from "@/data/workspace/tables";
import { useWorkspace } from "@/hooks/use-workspace";
import { TRASH_RETENTION_DAYS } from "@/lib/records/retention";

export const Route = createFileRoute("/workspaces/$workspace/_core/tables/_list/trash")({
  staticData: { crumb: "Trash" },
  pendingComponent: () => null,
  loader: ({ context, params }) => {
    void context.queryClient
      .query(deletedTablesQueryOptions(params.workspace))
      .catch(() => undefined);
  },
  component: TablesTrashSheet,
});

function TablesTrashSheet() {
  const { workspace } = Route.useParams();
  const navigate = Route.useNavigate();
  const { isAdmin } = useWorkspace();

  if (!isAdmin) return <Navigate to="/workspaces/$workspace/tables" params={{ workspace }} replace />;

  return (
    <TrashSheet
      title="Deleted tables"
      description={`Deleted tables are kept for ${TRASH_RETENTION_DAYS} days.`}
      onClose={() => navigate({ to: "/workspaces/$workspace/tables", params: { workspace } })}
    >
      <TablesTrash workspace={workspace} />
    </TrashSheet>
  );
}
