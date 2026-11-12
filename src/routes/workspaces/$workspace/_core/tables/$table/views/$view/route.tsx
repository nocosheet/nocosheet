import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";

import { viewsQueryOptions } from "@/data/workspace/views";

export const Route = createFileRoute("/workspaces/$workspace/_core/tables/$table/views/$view")({
  staticData: { crumb: (loaderData) => (loaderData as { name?: string } | undefined)?.name },
  loader: async ({ context, params }) => {
    const viewId = Number(params.view);
    if (!Number.isInteger(viewId) || viewId < 1) throw notFound();

    const views = await context.queryClient
      .query(viewsQueryOptions(params.workspace, Number(params.table)))
      .catch(() => []);
    const view = views.find((item) => item.id === viewId);
    if (!view) throw notFound();
    return view;
  },
  component: Outlet,
});
