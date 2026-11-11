import { createFileRoute, Navigate } from "@tanstack/react-router";

import { CreateRecordSheet } from "@/components/workspace/records/record-sheet/create-record-sheet";
import { useAccess } from "@/hooks/use-access";

export const Route = createFileRoute("/w/$workspace/_core/tables/$table/_viewer/new")({
  component: NewRecordPage,
});

function NewRecordPage() {
  const { workspace, table } = Route.useParams();
  const navigate = Route.useNavigate();
  const access = useAccess();

  if (!access.can("create", Number(table)))
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
