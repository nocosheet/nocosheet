import { useQuery } from "@tanstack/react-query";
import { createFileRoute, getRouteApi } from "@tanstack/react-router";

import { DetailRecordSheet } from "@/components/workspace/records/record-sheet/detail-record-sheet";
import { UpdateRecordSheet } from "@/components/workspace/records/record-sheet/update-record-sheet";
import { recordQueryOptions } from "@/data/workspace/records";
import { useAccess } from "@/hooks/use-access";

const viewRoute = getRouteApi("/workspaces/$workspace/_core/tables/$table/views/$view");

export const Route = createFileRoute(
  "/workspaces/$workspace/_core/tables/$table/views/$view/_viewer/$record",
)({
  pendingComponent: () => null,
  loader: ({ context, params }) => {
    void context.queryClient
      .query(recordQueryOptions(params.workspace, Number(params.table), params.record))
      .catch(() => undefined);
  },
  component: RecordPage,
});

function RecordPage() {
  const { workspace, table, view: viewId, record } = Route.useParams();
  const loaded = viewRoute.useLoaderData();
  const navigate = Route.useNavigate();
  const access = useAccess();
  const tableId = Number(table);
  const view = { id: loaded.id, selectColumns: loaded.selectColumns };
  const { data } = useQuery(recordQueryOptions(workspace, tableId, record));

  const owner = (data?.created_by as { id?: string } | null | undefined)?.id;
  const editable = access.canOn("update", tableId, owner);
  const sheetProps = {
    workspace,
    tableId,
    recordId: record,
    view,
    onClose: () =>
      navigate({
        to: "/workspaces/$workspace/tables/$table/views/$view",
        params: { workspace, table, view: viewId },
        search: (previous) => previous,
      }),
  };

  return editable ? (
    <UpdateRecordSheet {...sheetProps} canDelete={access.canOn("delete", tableId, owner)} />
  ) : (
    <DetailRecordSheet {...sheetProps} />
  );
}
