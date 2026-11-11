import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/w/$workspace/settings/members/roles")({
  staticData: { crumb: "Roles" },
  beforeLoad: ({ context, params }) => {
    if (!context.workspace.isAdmin)
      throw redirect({
        to: "/w/$workspace/settings/role",
        params: { workspace: params.workspace },
      });
  },
  component: Outlet,
});
