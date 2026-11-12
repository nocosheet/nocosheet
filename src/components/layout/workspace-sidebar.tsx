import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

import { NavFavorites } from "./sidebar/nav-favorites";
import { NavMain } from "./sidebar/nav-main";
import { NavSecondary } from "./sidebar/nav-secondary";
import { NavTables } from "./sidebar/nav-tables";
import { WorkspaceSwitcher } from "./sidebar/workspace-switcher";

type WorkspaceSidebarProps = {
  workspace: string;
  user: { name: string; email: string; image?: string | null };
};

/** Inset sidebar (shadcn sidebar-08) for the app pages under `/workspaces/$workspace`. */
export function WorkspaceSidebar({ workspace, user }: WorkspaceSidebarProps) {
  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <WorkspaceSwitcher workspace={workspace} user={user} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain workspace={workspace} />
        <NavFavorites workspace={workspace} />
        <NavTables workspace={workspace} />
      </SidebarContent>
      <SidebarFooter>
        <NavSecondary workspace={workspace} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
