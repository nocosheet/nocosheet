import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { membersQueryOptions } from "@/data/workspace/members";
import { DEFAULT_WORKSPACE } from "@/lib/workspace";

export const Route = createFileRoute("/w/$workspace")({
  beforeLoad: ({ context, params }) => {
    if (!context.session) throw redirect({ to: "/auth/sign-in" });
    // One workspace per instance: any other slug resolves to the default one.
    if (params.workspace !== DEFAULT_WORKSPACE) {
      throw redirect({ to: "/w/$workspace", params: { workspace: DEFAULT_WORKSPACE } });
    }
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(membersQueryOptions),
  component: Outlet,
});
