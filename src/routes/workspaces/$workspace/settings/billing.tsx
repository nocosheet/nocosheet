import { createFileRoute } from "@tanstack/react-router";

import { WorkspaceContent, WorkspaceHeader } from "@/components/layout/workspace-header";
import { SettingsBilling } from "@/components/workspace/settings/billing";

export const Route = createFileRoute("/workspaces/$workspace/settings/billing")({
  staticData: { crumb: "Billing" },
  component: Page,
});

function Page() {
  const { workspace } = Route.useParams();
  return (
    <>
      <WorkspaceHeader workspace={workspace} />
      <WorkspaceContent className="max-w-3xl">
        <SettingsBilling />
      </WorkspaceContent>
    </>
  );
}
