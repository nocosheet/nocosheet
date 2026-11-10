import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { membersQueryOptions } from "@/data/workspace/members";
import { sidebarQueryOptions } from "@/data/workspace/sidebar";
import { DEFAULT_ROLE, isAdmin } from "@/lib/auth/access";
import { DEFAULT_WORKSPACE, DEFAULT_WORKSPACE_NAME } from "@/lib/workspace";

export const Route = createFileRoute("/w/$workspace")({
  beforeLoad: ({ context, params }) => {
    if (!context.session) throw redirect({ to: "/auth/sign-in" });
    // One workspace per instance: any other slug resolves to the default one.
    if (params.workspace !== DEFAULT_WORKSPACE) {
      throw redirect({ to: "/w/$workspace", params: { workspace: DEFAULT_WORKSPACE } });
    }

    const role = (context.session.user as { role?: string | null }).role ?? DEFAULT_ROLE;
    return {
      workspace: {
        id: DEFAULT_WORKSPACE,
        name: DEFAULT_WORKSPACE_NAME,
        role,
        isAdmin: isAdmin({ role }),
      },
    };
  },
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.query({ ...membersQueryOptions, staleTime: "static" }),
      context.queryClient.query(sidebarQueryOptions(params.workspace)),
    ]);
  },
  component: Outlet,
});
