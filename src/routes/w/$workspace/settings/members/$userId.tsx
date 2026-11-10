import { createFileRoute, notFound, redirect } from "@tanstack/react-router";

import { WorkspaceContent, WorkspaceHeader } from "@/components/layout/workspace-header";
import { MemberDetail } from "@/components/workspace/settings/members/member-detail";
import { MemberNotFound } from "@/components/workspace/settings/members/member-not-found";
import { adminUserQueryOptions } from "@/data/admin/user";
import { adminUserSessionsQueryOptions } from "@/data/admin/user-sessions";
import { membersQueryOptions } from "@/data/workspace/members";

export const Route = createFileRoute("/w/$workspace/settings/members/$userId")({
  beforeLoad: ({ context, params }) => {
    if (!context.workspace.isAdmin) {
      throw redirect({
        to: "/w/$workspace/settings/members",
        params: { workspace: params.workspace },
      });
    }
  },
  loader: async ({ context, params }) => {
    const members = await context.queryClient.query({
      ...membersQueryOptions,
      staleTime: "static",
    });

    const member = members.find((item) => item.id === params.userId);
    if (!member) throw notFound();

    await Promise.allSettled([
      context.queryClient.query({ ...adminUserQueryOptions(params.userId), staleTime: "static" }),
      context.queryClient.query({
        ...adminUserSessionsQueryOptions(params.userId),
        staleTime: "static",
      }),
    ]);

    return { memberName: member.name };
  },
  staticData: {
    crumb: (loaderData) =>
      (loaderData as { memberName?: string } | undefined)?.memberName ?? "Member",
  },
  notFoundComponent: MemberNotFound,
  component: MemberPage,
});

function MemberPage() {
  const { workspace, userId } = Route.useParams();
  return (
    <>
      <WorkspaceHeader workspace={workspace} />
      <WorkspaceContent className="max-w-3xl">
        <MemberDetail userId={userId} />
      </WorkspaceContent>
    </>
  );
}
