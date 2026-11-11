import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import {
  DownloadIcon,
  EllipsisIcon,
  PlusIcon,
  RefreshCwIcon,
  SlidersHorizontalIcon,
  Trash2Icon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Group, GroupSeparator } from "@/components/ui/group";
import { Menu, MenuItem, MenuLinkItem, MenuPopup, MenuTrigger } from "@/components/ui/menu";
import { workspaceKeys } from "@/data/workspace/keys";
import { useAccess } from "@/hooks/use-access";

import { useExportRecords } from "./use-export-records";

export function TableActions({ workspace, table }: { workspace: string; table: string }) {
  const access = useAccess();
  const queryClient = useQueryClient();
  const tableId = Number(table);
  const exportRecords = useExportRecords(workspace, tableId);
  const canExport = access.can("export", tableId) && access.can("read", tableId);

  const menu = (
    <Menu>
      <MenuTrigger render={<Button size="icon-sm" variant="outline" aria-label="More actions" />}>
        <EllipsisIcon />
      </MenuTrigger>
      <MenuPopup align="end">
        <MenuLinkItem
          render={
            <Link to="/w/$workspace/tables/$table/definition" params={{ workspace, table }} />
          }
        >
          <SlidersHorizontalIcon />
          Definition
        </MenuLinkItem>
        {canExport && (
          <MenuItem
            disabled={exportRecords.isPending}
            onClick={() => exportRecords.mutate(undefined)}
          >
            <DownloadIcon />
            Export
          </MenuItem>
        )}
        {access.admin && (
          <MenuLinkItem
            render={<Link to="/w/$workspace/tables/$table/trash" params={{ workspace, table }} />}
          >
            <Trash2Icon />
            Trash
          </MenuLinkItem>
        )}
        <MenuItem
          onClick={() =>
            void queryClient.invalidateQueries({ queryKey: workspaceKeys.table(Number(table)) })
          }
        >
          <RefreshCwIcon />
          Refresh
        </MenuItem>
      </MenuPopup>
    </Menu>
  );

  if (!access.can("create", tableId)) return menu;

  return (
    <Group>
      <Button
        size="sm"
        variant="outline"
        aria-label="New record"
        className="max-sm:w-8 max-sm:px-0"
        render={
          <Link
            to="/w/$workspace/tables/$table/new"
            params={{ workspace, table }}
            search={(previous) => previous}
          />
        }
      >
        <PlusIcon />
        <span className="max-sm:hidden">New record</span>
      </Button>
      <GroupSeparator />
      {menu}
    </Group>
  );
}
