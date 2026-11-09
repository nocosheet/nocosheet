import { Link } from "@tanstack/react-router";

import { ArrowLeftIcon } from "lucide-react";

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

import { NavSettings } from "./sidebar/nav-settings";
import { NavUser } from "./sidebar/nav-user";

type SettingsSidebarProps = {
  workspace: string;
  user: { name: string; email: string; image?: string | null };
};

/** Inset sidebar for everything under `/w/$workspace/settings`. */
export function SettingsSidebar({ workspace, user }: SettingsSidebarProps) {
  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Back to app"
              render={<Link to="/w/$workspace" params={{ workspace }} />}
            >
              <ArrowLeftIcon />
              <span className="font-medium">Back to app</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavSettings workspace={workspace} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
