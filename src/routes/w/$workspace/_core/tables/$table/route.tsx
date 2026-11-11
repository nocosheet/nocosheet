import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";

import { tableQueryOptions } from "@/data/workspace/tables";

export const Route = createFileRoute("/w/$workspace/_core/tables/$table")({
  staticData: { crumb: (loaderData) => (loaderData as { name?: string } | undefined)?.name },
  loader: ({ context, params }) => {
    const id = Number(params.table);
    if (!Number.isInteger(id) || id < 1) throw notFound();
    return context.queryClient
      .query({ ...tableQueryOptions(params.workspace, id), staleTime: 0 })
      .catch(() => {
        throw notFound();
      });
  },
  component: Outlet,
});
