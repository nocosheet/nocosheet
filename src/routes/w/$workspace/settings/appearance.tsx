import { createFileRoute } from "@tanstack/react-router";

import { WorkspaceContent, WorkspaceHeader } from "@/components/layout/workspace-header";
import { SettingsAppearance } from "@/components/workspace/settings/appearance";

export const Route = createFileRoute("/w/$workspace/settings/appearance")({
  staticData: { crumb: "Appearance" },
  component: Page,
});

function Page() {
  const { workspace } = Route.useParams();
  return (
    <>
      <WorkspaceHeader workspace={workspace} />
      <WorkspaceContent className="max-w-3xl">
        <SettingsAppearance />
      </WorkspaceContent>
    </>
  );
}
