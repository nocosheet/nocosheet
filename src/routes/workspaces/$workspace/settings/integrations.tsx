import { createFileRoute } from "@tanstack/react-router";

import { WorkspaceContent, WorkspaceHeader } from "@/components/layout/workspace-header";
import { SettingsIntegrations } from "@/components/workspace/settings/integrations";

export const Route = createFileRoute("/workspaces/$workspace/settings/integrations")({
  staticData: { crumb: "Integrations" },
  component: Page,
});

function Page() {
  const { workspace } = Route.useParams();
  return (
    <>
      <WorkspaceHeader workspace={workspace} />
      <WorkspaceContent className="max-w-3xl">
        <SettingsIntegrations />
      </WorkspaceContent>
    </>
  );
}
