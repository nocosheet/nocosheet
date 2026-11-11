import { createFileRoute } from "@tanstack/react-router";

import { RestoreRecordSheet } from "@/components/workspace/records/record-sheet/restore-record-sheet";
import { trashEntryQueryOptions } from "@/data/workspace/trash";

export const Route = createFileRoute("/w/$workspace/_core/tables/$table/trash/$entry")({
  pendingComponent: () => null,
  loader: ({ context, params }) => {
    void context.queryClient
      .query(trashEntryQueryOptions(params.workspace, Number(params.table), Number(params.entry)))
      .catch(() => undefined);
  },
  component: RestoreEntryPage,
});

function RestoreEntryPage() {
  const { workspace, table, entry } = Route.useParams();
  const navigate = Route.useNavigate();

  return (
    <RestoreRecordSheet
      workspace={workspace}
      tableId={Number(table)}
      entryId={Number(entry)}
      onClose={() =>
        navigate({
          to: "/w/$workspace/tables/$table/trash",
          params: { workspace, table },
          search: (previous) => previous,
        })
      }
    />
  );
}
