import { createFileRoute } from "@tanstack/react-router";

import { WorkspaceContent, WorkspaceHeader } from "@/components/layout/workspace-header";
import { DeleteTablesDialog } from "@/components/workspace/tables/delete-tables-dialog";
import { TableDefinition } from "@/components/workspace/tables/table-definition";
import { TableDefinitionView } from "@/components/workspace/tables/table-definition-view";
import { useWorkspace } from "@/hooks/use-workspace";

export const Route = createFileRoute("/w/$workspace/_core/tables/$table/definition")({
  staticData: { crumb: "Definition" },
  component: DefinitionPage,
});

function DefinitionPage() {
  const { workspace, table } = Route.useParams();
  const navigate = Route.useNavigate();
  const tableId = Number(table);
  const { isAdmin } = useWorkspace();

  return (
    <>
      <WorkspaceHeader workspace={workspace}>
        {isAdmin && (
          <DeleteTablesDialog
            workspace={workspace}
            ids={[tableId]}
            label="Delete table"
            size="sm"
            onDeleted={() => navigate({ to: "/w/$workspace/tables", params: { workspace } })}
          />
        )}
      </WorkspaceHeader>
      <WorkspaceContent className="max-w-3xl">
        {isAdmin ? (
          <TableDefinition workspace={workspace} tableId={tableId} />
        ) : (
          <TableDefinitionView workspace={workspace} tableId={tableId} />
        )}
      </WorkspaceContent>
    </>
  );
}
