import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";

import { tableQueryOptions } from "@/data/workspace/tables";
import { viewsQueryOptions } from "@/data/workspace/views";

export const Route = createFileRoute("/workspaces/$workspace/_core/tables/$table")({
  staticData: { crumb: (loaderData) => (loaderData as { name?: string } | undefined)?.name },
  loader: async ({ context, params }) => {
    const id = Number(params.table);
    if (!Number.isInteger(id) || id < 1) throw notFound();
    const [table] = await Promise.all([
      context.queryClient
        .query({ ...tableQueryOptions(params.workspace, id), staleTime: 0 })
        .catch(() => {
          throw notFound();
        }),
      context.queryClient.query(viewsQueryOptions(params.workspace, id)).catch(() => undefined),
    ]);
    return table;
  },
  component: Outlet,
});
