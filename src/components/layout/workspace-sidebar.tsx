import { Link } from "@tanstack/react-router";

import { LogoMark } from "@/components/brand/logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { DEFAULT_WORKSPACE_NAME } from "@/lib/workspace";

import { NavFavorites } from "./sidebar/nav-favorites";
import { NavMain } from "./sidebar/nav-main";
import { NavSecondary } from "./sidebar/nav-secondary";
import { NavTables } from "./sidebar/nav-tables";
import { NavUser } from "./sidebar/nav-user";

type WorkspaceSidebarProps = {
  workspace: string;
  user: { name: string; email: string; image?: string | null };
};

/** Inset sidebar (shadcn sidebar-08) for the app pages under `/w/$workspace`. */
export function WorkspaceSidebar({ workspace, user }: WorkspaceSidebarProps) {
  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip="Nocosheet"
              render={<Link to="/w/$workspace" params={{ workspace }} />}
            >
              <span className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <LogoMark className="size-5" />
              </span>
              <div className="grid flex-1 text-start leading-tight">
                <span className="truncate font-semibold text-sm">Nocosheet</span>
                <span className="truncate text-muted-foreground text-xs">
                  {DEFAULT_WORKSPACE_NAME}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain workspace={workspace} />
        <NavFavorites workspace={workspace} />
        <NavTables workspace={workspace} />
        <NavSecondary workspace={workspace} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
