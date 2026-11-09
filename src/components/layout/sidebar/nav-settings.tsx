import { Link } from "@tanstack/react-router";

import {
  CreditCardIcon,
  DatabaseBackupIcon,
  KeyRoundIcon,
  PaletteIcon,
  PlugIcon,
  SlidersHorizontalIcon,
  UsersIcon,
} from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useIsActivePath } from "@/hooks/use-is-active-path";

const groups = [
  {
    label: "Workspace",
    items: [
      {
        to: "/w/$workspace/settings",
        label: "General",
        icon: SlidersHorizontalIcon,
        path: "",
        exact: true,
      },
      { to: "/w/$workspace/settings/members", label: "Members", icon: UsersIcon, path: "/members" },
      {
        to: "/w/$workspace/settings/billing",
        label: "Billing",
        icon: CreditCardIcon,
        path: "/billing",
      },
      {
        to: "/w/$workspace/settings/appearance",
        label: "Appearance",
        icon: PaletteIcon,
        path: "/appearance",
      },
    ],
  },
  {
    label: "Data & integrations",
    items: [
      { to: "/w/$workspace/settings/data", label: "Data", icon: DatabaseBackupIcon, path: "/data" },
      {
        to: "/w/$workspace/settings/integrations",
        label: "Integrations",
        icon: PlugIcon,
        path: "/integrations",
      },
      { to: "/w/$workspace/settings/api", label: "API", icon: KeyRoundIcon, path: "/api" },
    ],
  },
] as const;

export function NavSettings({ workspace }: { workspace: string }) {
  const isActive = useIsActivePath();

  return (
    <>
      {groups.map((group) => (
        <SidebarGroup key={group.label}>
          <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {group.items.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton
                    tooltip={item.label}
                    isActive={isActive(
                      `/w/${workspace}/settings${item.path}`,
                      "exact" in item && item.exact,
                    )}
                    render={<Link to={item.to} params={{ workspace }} />}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  );
}
