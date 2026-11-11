import { createFileRoute, Navigate } from "@tanstack/react-router";

import { CreateRecordSheet } from "@/components/workspace/records/record-sheet/create-record-sheet";
import { useWorkspace } from "@/hooks/use-workspace";

export const Route = createFileRoute("/w/$workspace/_app/tables/$table/_viewer/new")({
  component: NewRecordPage,
});

function NewRecordPage() {
  const { workspace, table } = Route.useParams();
  const navigate = Route.useNavigate();
  const { isAdmin } = useWorkspace();

  if (!isAdmin)
    return (
      <Navigate
        to="/w/$workspace/tables/$table"
        params={{ workspace, table }}
        search={(previous) => previous}
        replace
      />
    );

  return (
    <CreateRecordSheet
      workspace={workspace}
      tableId={Number(table)}
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
