import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";

import { TrashList } from "@/components/workspace/records/trash-list";
import { TrashSheet } from "@/components/workspace/trash/trash-sheet";
import { trashQueryOptions } from "@/data/workspace/trash";
import { useWorkspace } from "@/hooks/use-workspace";
import { TRASH_RETENTION_DAYS } from "@/lib/records/retention";
import { resolveTrashQuery } from "@/lib/trash/query";

export const Route = createFileRoute("/workspaces/$workspace/_core/tables/$table/_viewer/trash")({
  staticData: { crumb: "Trash" },
  pendingComponent: () => null,
  loader: ({ context, params }) => {
    void context.queryClient
      .query(trashQueryOptions(params.workspace, Number(params.table), resolveTrashQuery({})))
      .catch(() => undefined);
  },
  component: RecordsTrashSheet,
});

function RecordsTrashSheet() {
  const { workspace, table } = Route.useParams();
  const navigate = Route.useNavigate();
  const { isAdmin } = useWorkspace();

  if (!isAdmin)
    return (
      <Navigate
        to="/workspaces/$workspace/tables/$table"
        params={{ workspace, table }}
        search={(previous) => previous}
        replace
      />
    );

  return (
    <TrashSheet
      title="Deleted records"
      description={`Deleted records are kept for ${TRASH_RETENTION_DAYS} days.`}
      onClose={() =>
        navigate({
          to: "/workspaces/$workspace/tables/$table",
          params: { workspace, table },
          search: (previous) => previous,
        })
      }
      nested={<Outlet />}
    >
      <TrashList workspace={workspace} tableId={Number(table)} table={table} />
    </TrashSheet>
  );
}
