import { createFileRoute } from "@tanstack/react-router";

import { WorkspaceContent, WorkspaceHeader } from "@/components/layout/workspace-header";
import { SettingsData } from "@/components/workspace/settings/data";

export const Route = createFileRoute("/w/$workspace/settings/data")({
  staticData: { crumb: "Data" },
  component: Page,
});

function Page() {
  const { workspace } = Route.useParams();
  return (
    <>
      <WorkspaceHeader workspace={workspace} />
      <WorkspaceContent className="max-w-3xl">
        <SettingsData />
      </WorkspaceContent>
    </>
  );
}
