import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { DetailRecordSheet } from "@/components/workspace/records/record-sheet/detail-record-sheet";
import { UpdateRecordSheet } from "@/components/workspace/records/record-sheet/update-record-sheet";
import { recordQueryOptions } from "@/data/workspace/records";
import { useAccess } from "@/hooks/use-access";

export const Route = createFileRoute("/workspaces/$workspace/_core/tables/$table/_viewer/$record")({
  pendingComponent: () => null,
  loader: ({ context, params }) => {
    void context.queryClient
      .query(recordQueryOptions(params.workspace, Number(params.table), Number(params.record)))
      .catch(() => undefined);
  },
  component: RecordPage,
});

function RecordPage() {
  const { workspace, table, record } = Route.useParams();
  const navigate = Route.useNavigate();
  const access = useAccess();
  const tableId = Number(table);
  const { data } = useQuery(recordQueryOptions(workspace, tableId, Number(record)));

  const owner = (data?.created_by as { id?: string } | null | undefined)?.id;
  const editable = access.canOn("update", tableId, owner);
  const sheetProps = {
    workspace,
    tableId,
    recordId: Number(record),
    onClose: () =>
      navigate({
        to: "/workspaces/$workspace/tables/$table",
        params: { workspace, table },
        search: (previous) => previous,
      }),
  };

  return editable ? (
    <UpdateRecordSheet {...sheetProps} canDelete={access.canOn("delete", tableId, owner)} />
  ) : (
    <DetailRecordSheet {...sheetProps} />
  );
}
