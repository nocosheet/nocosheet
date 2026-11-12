import { createFileRoute, getRouteApi, Navigate } from "@tanstack/react-router";

import { CreateRecordSheet } from "@/components/workspace/records/record-sheet/create-record-sheet";
import { useAccess } from "@/hooks/use-access";

const viewRoute = getRouteApi("/workspaces/$workspace/_core/tables/$table/views/$view");

export const Route = createFileRoute(
  "/workspaces/$workspace/_core/tables/$table/views/$view/_viewer/new",
)({
  pendingComponent: () => null,
  component: NewRecordPage,
});

function NewRecordPage() {
  const { workspace, table, view: viewId } = Route.useParams();
  const view = viewRoute.useLoaderData();
  const navigate = Route.useNavigate();
  const access = useAccess();

  if (!access.can("create", Number(table)))
    return (
      <Navigate
        to="/workspaces/$workspace/tables/$table/views/$view"
        params={{ workspace, table, view: viewId }}
        search={(previous) => previous}
        replace
      />
    );

  return (
    <CreateRecordSheet
      workspace={workspace}
      tableId={Number(table)}
      view={{ id: view.id, selectColumns: view.selectColumns }}
      onClose={() =>
        navigate({
          to: "/workspaces/$workspace/tables/$table/views/$view",
          params: { workspace, table, view: viewId },
          search: (previous) => previous,
        })
      }
    />
  );
}
