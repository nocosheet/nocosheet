import { createFileRoute } from "@tanstack/react-router";

import { WorkspaceContent, WorkspaceHeader } from "@/components/layout/workspace-header";
import { MemberDetail } from "@/components/workspace/member-detail";
import { adminUserQueryOptions } from "@/data/admin/user";
import { adminUserSessionsQueryOptions } from "@/data/admin/user-sessions";
import { membersQueryOptions } from "@/data/workspace/members";
import { isAdmin } from "@/lib/auth/access";

export const Route = createFileRoute("/w/$workspace/settings/members/$userId")({
  loader: async ({ context, params }) => {
    const members = await context.queryClient.ensureQueryData(membersQueryOptions);

    // Admins see the full account; fetch it up front. Errors (e.g. a stale id) fall back to the
    // directory view's "not found" state instead of breaking navigation.
    if (isAdmin(context.session?.user)) {
      await Promise.allSettled([
        context.queryClient.ensureQueryData(adminUserQueryOptions(params.userId)),
        context.queryClient.ensureQueryData(adminUserSessionsQueryOptions(params.userId)),
      ]);
    }

    return { memberName: members.find((member) => member.id === params.userId)?.name };
  },
  staticData: {
    crumb: (loaderData) =>
      (loaderData as { memberName?: string } | undefined)?.memberName ?? "Member",
  },
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
