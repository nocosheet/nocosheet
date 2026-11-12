import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/workspaces/$workspace/settings/members/roles")({
  staticData: { crumb: "Roles" },
  beforeLoad: ({ context, params }) => {
    if (!context.workspace.isAdmin)
      throw redirect({
        to: "/workspaces/$workspace/settings/role",
        params: { workspace: params.workspace },
      });
  },
  component: Outlet,
});
