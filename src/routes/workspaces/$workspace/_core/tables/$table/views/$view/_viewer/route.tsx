import { createFileRoute, getRouteApi, Outlet } from "@tanstack/react-router";

import { WorkspaceContent, WorkspaceHeader } from "@/components/layout/workspace-header";
import { ViewGridView } from "@/components/workspace/records/grid/view-grid-view";
import { ViewActions } from "@/components/workspace/views/view-actions";
import { viewRecordsQueryOptions } from "@/data/workspace/views";
import { resolveRecordsQuery, validateRecordsSearch } from "@/lib/records/query";

const viewRoute = getRouteApi("/workspaces/$workspace/_core/tables/$table/views/$view");

export const Route = createFileRoute(
  "/workspaces/$workspace/_core/tables/$table/views/$view/_viewer",
)({
  validateSearch: (search: Record<string, unknown>) => search,
  loaderDeps: ({ search }) => resolveRecordsQuery(validateRecordsSearch(search)),
  loader: ({ context, deps, params }) => {
    void context.queryClient.prefetchQuery(
      viewRecordsQueryOptions(params.workspace, Number(params.table), Number(params.view), deps),
    );
  },
  component: ViewerPage,
});

function ViewerPage() {
  const { workspace, table, view: viewId } = Route.useParams();
  const view = viewRoute.useLoaderData();
  const navigate = Route.useNavigate();

  return (
    <>
      <WorkspaceHeader workspace={workspace}>
        <ViewActions workspace={workspace} table={table} view={Number(viewId)} />
      </WorkspaceHeader>
      <WorkspaceContent className="flex max-w-none flex-col px-0 pb-0 md:px-0">
        <ViewGridView
          workspace={workspace}
          tableId={Number(table)}
          view={{ id: view.id, selectColumns: view.selectColumns }}
          onOpenRecord={(id) =>
            navigate({
              to: "/workspaces/$workspace/tables/$table/views/$view/$record",
              params: { workspace, table, view: viewId, record: String(id) },
              search: (previous) => previous,
            })
          }
        />
      </WorkspaceContent>
      <Outlet />
    </>
  );
}
