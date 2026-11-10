import { createFileRoute, notFound } from "@tanstack/react-router";

import { WorkspaceContent, WorkspaceHeader } from "@/components/layout/workspace-header";
import { MemberDetail } from "@/components/workspace/member-detail";
import { MemberNotFound } from "@/components/workspace/member-not-found";
import { adminUserQueryOptions } from "@/data/admin/user";
import { adminUserSessionsQueryOptions } from "@/data/admin/user-sessions";
import { membersQueryOptions } from "@/data/workspace/members";

export const Route = createFileRoute("/w/$workspace/settings/members/$userId")({
  loader: async ({ context, params }) => {
    const members = await context.queryClient.query({
      ...membersQueryOptions,
      staleTime: "static",
    });

    const member = members.find((item) => item.id === params.userId);
    if (!member) throw notFound();

    if (context.workspace.isAdmin) {
      await Promise.allSettled([
        context.queryClient.query({ ...adminUserQueryOptions(params.userId), staleTime: "static" }),
        context.queryClient.query({
          ...adminUserSessionsQueryOptions(params.userId),
          staleTime: "static",
        }),
      ]);
    }

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
