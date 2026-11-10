import { createFileRoute } from "@tanstack/react-router";

import { WorkspaceContent, WorkspaceHeader } from "@/components/layout/workspace-header";
import { SettingsGeneral } from "@/components/workspace/settings/general";

export const Route = createFileRoute("/w/$workspace/settings/")({
  staticData: { crumb: "General" },
  component: SettingsPage,
});

function SettingsPage() {
  const { workspace } = Route.useParams();
  return (
    <>
      <WorkspaceHeader workspace={workspace} />
      <WorkspaceContent className="max-w-3xl">
        <SettingsGeneral />
      </WorkspaceContent>
    </>
  );
}
