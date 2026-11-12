import { createFileRoute, Outlet } from "@tanstack/react-router";

import { WorkspaceContent, WorkspaceHeader } from "@/components/layout/workspace-header";
import { TableGridView } from "@/components/workspace/records/grid/table-grid-view";
import { TableActions } from "@/components/workspace/records/table-actions";
import { recordsQueryOptions } from "@/data/workspace/records";
import { resolveRecordsQuery, validateRecordsSearch } from "@/lib/records/query";

export const Route = createFileRoute("/w/$workspace/_core/tables/$table/_viewer")({
  validateSearch: (search: Record<string, unknown>) => search,
  loaderDeps: ({ search }) => resolveRecordsQuery(validateRecordsSearch(search)),
  loader: async ({ context, deps, params }) => {
    await context.queryClient
      .query(recordsQueryOptions(params.workspace, Number(params.table), deps))
      .catch(() => undefined);
  },
  component: ViewerPage,
});

function ViewerPage() {
  const { workspace, table } = Route.useParams();
  const navigate = Route.useNavigate();

  return (
    <>
      <WorkspaceHeader workspace={workspace}>
        <TableActions workspace={workspace} table={table} />
      </WorkspaceHeader>
      <WorkspaceContent className="flex max-w-none flex-col px-0 pb-0 md:px-0">
        <TableGridView
          workspace={workspace}
          tableId={Number(table)}
          onOpenRecord={(id) =>
            navigate({
              to: "/w/$workspace/tables/$table/$record",
              params: { workspace, table, record: String(id) },
              search: (previous) => previous,
            })
          }
        />
      </WorkspaceContent>
      <Outlet />
    </>
  );
}
