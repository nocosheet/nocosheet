import { createFileRoute, notFound } from "@tanstack/react-router";

import { WorkspaceContent, WorkspaceHeader } from "@/components/layout/workspace-header";
import { ViewGridView } from "@/components/workspace/records/grid/view-grid-view";
import { ViewsMenu } from "@/components/workspace/views/views-menu";
import { viewRecordsQueryOptions, viewsQueryOptions } from "@/data/workspace/views";
import { resolveRecordsQuery, validateRecordsSearch } from "@/lib/records/query";

export const Route = createFileRoute("/workspaces/$workspace/_core/tables/$table/views/$view")({
  staticData: { crumb: (loaderData) => (loaderData as { name?: string } | undefined)?.name },
  validateSearch: (search: Record<string, unknown>) => search,
  loaderDeps: ({ search }) => resolveRecordsQuery(validateRecordsSearch(search)),
  loader: async ({ context, deps, params }) => {
    const tableId = Number(params.table);
    const viewId = Number(params.view);
    if (!Number.isInteger(viewId) || viewId < 1) throw notFound();

    const views = await context.queryClient
      .query(viewsQueryOptions(params.workspace, tableId))
      .catch(() => []);
    const view = views.find((item) => item.id === viewId);
    if (!view) throw notFound();

    void context.queryClient.prefetchQuery(
      viewRecordsQueryOptions(params.workspace, tableId, viewId, deps),
    );
    return view;
  },
  component: ViewPage,
});

function ViewPage() {
  const { workspace, table, view: viewId } = Route.useParams();
  const view = Route.useLoaderData();

  return (
    <>
      <WorkspaceHeader workspace={workspace}>
        <ViewsMenu workspace={workspace} table={table} activeView={Number(viewId)} />
      </WorkspaceHeader>
      <WorkspaceContent className="flex max-w-none flex-col px-0 pb-0 md:px-0">
        <ViewGridView
          workspace={workspace}
          tableId={Number(table)}
          view={{ id: view.id, selectColumns: view.selectColumns }}
        />
      </WorkspaceContent>
    </>
  );
}
