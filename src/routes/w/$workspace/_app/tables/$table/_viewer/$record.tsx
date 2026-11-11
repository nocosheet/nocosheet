import { createFileRoute } from "@tanstack/react-router";

import { DetailRecordSheet } from "@/components/workspace/records/record-sheet/detail-record-sheet";
import { UpdateRecordSheet } from "@/components/workspace/records/record-sheet/update-record-sheet";
import { recordQueryOptions } from "@/data/workspace/records";
import { useWorkspace } from "@/hooks/use-workspace";

export const Route = createFileRoute("/w/$workspace/_app/tables/$table/_viewer/$record")({
  loader: ({ context, params }) => {
    void context.queryClient
      .query(recordQueryOptions(params.workspace, Number(params.table), params.record))
      .catch(() => undefined);
  },
  component: RecordPage,
});

function RecordPage() {
  const { workspace, table, record } = Route.useParams();
  const navigate = Route.useNavigate();
  const { isAdmin } = useWorkspace();
  const Sheet = isAdmin ? UpdateRecordSheet : DetailRecordSheet;

  return (
    <Sheet
      workspace={workspace}
      tableId={Number(table)}
      recordId={record}
      onClose={() =>
        navigate({
          to: "/w/$workspace/tables/$table",
          params: { workspace, table },
          search: (previous) => previous,
        })
      }
    />
  );
}
