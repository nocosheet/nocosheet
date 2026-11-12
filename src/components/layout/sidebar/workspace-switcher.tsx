import { Link } from "@tanstack/react-router";

import { CheckIcon, ChevronsUpDownIcon, LogOutIcon } from "lucide-react";

import { LogoMark } from "@/components/brand/logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Menu,
  MenuGroup,
  MenuGroupLabel,
  MenuLinkItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useSignOut } from "@/hooks/use-sign-out";
import { getInitials } from "@/lib/initials";
import { DEFAULT_WORKSPACE_NAME } from "@/lib/workspace";

type WorkspaceSwitcherProps = {
  workspace: string;
  user: { name: string; email: string; image?: string | null };
};

export function WorkspaceSwitcher({ workspace, user }: WorkspaceSwitcherProps) {
  const { isMobile } = useSidebar();
  const signOut = useSignOut();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Menu>
          <MenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                tooltip="Nocosheet"
                aria-label="Open workspace menu"
                className="data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground"
              />
            }
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
            <ChevronsUpDownIcon className="ms-auto size-4" />
          </MenuTrigger>
          <MenuPopup
            side={isMobile ? "bottom" : "right"}
            align="start"
            sideOffset={8}
            className="w-64 max-w-[calc(100vw-1rem)]"
          >
            <MenuGroup>
              <MenuGroupLabel>Workspace</MenuGroupLabel>
              <MenuLinkItem render={<Link to="/workspaces/$workspace" params={{ workspace }} />}>
                <span className="flex size-6 items-center justify-center rounded-md border">
                  <LogoMark className="size-4" />
                </span>
                <span className="flex-1 truncate">{DEFAULT_WORKSPACE_NAME}</span>
                <CheckIcon />
              </MenuLinkItem>
            </MenuGroup>
            <MenuSeparator />
            <div className="flex items-center gap-1">
              <MenuLinkItem className="flex-1" render={<Link to="/account" />}>
                <Avatar className="size-6">
                  {user.image && <AvatarImage src={user.image} alt="" />}
                  <AvatarFallback>{getInitials(user.name) || "U"}</AvatarFallback>
                </Avatar>
                <span className="truncate">{user.name}</span>
              </MenuLinkItem>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Sign out"
                loading={signOut.isPending}
                onClick={() => signOut.mutate()}
              >
                <LogOutIcon />
              </Button>
            </div>
          </MenuPopup>
        </Menu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
