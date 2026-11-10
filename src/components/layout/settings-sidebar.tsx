import { Sidebar, SidebarContent, SidebarHeader, SidebarRail } from "@/components/ui/sidebar";

import { NavBack } from "./sidebar/nav-back";
import { NavSettings } from "./sidebar/nav-settings";
import { WorkspaceSwitcher } from "./sidebar/workspace-switcher";

type SettingsSidebarProps = {
  workspace: string;
  user: { name: string; email: string; image?: string | null };
};

/** Inset sidebar for everything under `/w/$workspace/settings`, laid out like the app sidebar. */
export function SettingsSidebar({ workspace, user }: SettingsSidebarProps) {
  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <WorkspaceSwitcher workspace={workspace} user={user} />
      </SidebarHeader>
      <SidebarContent>
        <NavSettings workspace={workspace} />
        <NavBack workspace={workspace} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
