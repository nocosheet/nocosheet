import { createFileRoute } from "@tanstack/react-router";

import { WorkspaceContent, WorkspaceHeader } from "@/components/layout/workspace-header";
import { DeleteTablesDialog } from "@/components/workspace/tables/delete-tables-dialog";
import { TableDefinition } from "@/components/workspace/tables/table-definition";

export const Route = createFileRoute("/w/$workspace/_app/tables/$table/definition")({
  staticData: { crumb: "Definition" },
  component: DefinitionPage,
});

function DefinitionPage() {
  const { workspace, table } = Route.useParams();
  const navigate = Route.useNavigate();
  const tableId = Number(table);

  return (
    <>
      <WorkspaceHeader workspace={workspace}>
        <DeleteTablesDialog
          workspace={workspace}
          ids={[tableId]}
          label="Delete table"
          size="sm"
          onDeleted={() => navigate({ to: "/w/$workspace/tables", params: { workspace } })}
        />
      </WorkspaceHeader>
      <WorkspaceContent className="max-w-3xl">
        <TableDefinition workspace={workspace} tableId={tableId} />
      </WorkspaceContent>
    </>
  );
}
