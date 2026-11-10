import { createFileRoute, notFound, Outlet, redirect } from "@tanstack/react-router";

import { tableQueryOptions } from "@/data/workspace/tables";

export const Route = createFileRoute("/w/$workspace/_app/tables/$table")({
  staticData: { crumb: (loaderData) => (loaderData as { name?: string } | undefined)?.name },
  beforeLoad: ({ context, params }) => {
    if (!context.workspace.isAdmin)
      throw redirect({ to: "/w/$workspace/tables", params: { workspace: params.workspace } });
  },
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
