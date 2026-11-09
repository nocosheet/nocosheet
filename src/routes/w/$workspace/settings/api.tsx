import { createFileRoute } from "@tanstack/react-router";

import { WorkspaceContent, WorkspaceHeader } from "@/components/layout/workspace-header";
import { SettingsApi } from "@/components/workspace/settings-api";

export const Route = createFileRoute("/w/$workspace/settings/api")({
  staticData: { crumb: "API" },
  component: Page,
});

function Page() {
  const { workspace } = Route.useParams();
  return (
    <>
      <WorkspaceHeader workspace={workspace} />
      <WorkspaceContent className="max-w-3xl">
        <SettingsApi />
      </WorkspaceContent>
    </>
  );
}
