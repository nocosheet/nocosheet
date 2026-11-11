import { TableShortcuts } from "./overview/table-shortcuts";
import { TeamCard } from "./overview/team-card";
import { Welcome } from "./overview/welcome";
import { WorkspaceStats } from "./overview/workspace-stats";

export function WorkspaceOverview({ workspace }: { workspace: string }) {
  return (
    <div className="flex flex-col gap-8">
      <Welcome workspace={workspace} />
      <WorkspaceStats workspace={workspace} />
      <TableShortcuts workspace={workspace} />
      <TeamCard workspace={workspace} />
    </div>
  );
}
