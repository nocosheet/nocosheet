import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { ViewsMenu } from "@/components/workspace/views/views-menu";
import { workspaceKeys } from "@/data/workspace/keys";
import { viewsQueryOptions } from "@/data/workspace/views";
import { useAccess } from "@/hooks/use-access";

import { useExportRecords } from "./use-export-records";

export function TableActions({ workspace, table }: { workspace: string; table: string }) {
  const access = useAccess();
  const queryClient = useQueryClient();
  const tableId = Number(table);
  const exportRecords = useExportRecords(workspace, tableId);
  const { data: views } = useQuery(viewsQueryOptions(workspace, tableId));
  const showViews = access.admin || (views?.length ?? 0) > 0;
  const canExport = access.can("export", tableId) && access.can("read", tableId);

  const menu = (
    <Menu key="menu">
      <MenuTrigger render={<Button size="icon-sm" variant="outline" aria-label="More actions" />}>
        <EllipsisIcon />
      </MenuTrigger>
      <MenuPopup align="end">
        <MenuLinkItem
          render={
            <Link to="/workspaces/$workspace/tables/$table/definition" params={{ workspace, table }} />
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
            render={<Link to="/workspaces/$workspace/tables/$table/trash" params={{ workspace, table }} />}
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

  const parts = [
    access.can("create", tableId) && (
      <Button
        key="new"
        size="sm"
        variant="outline"
        aria-label="New record"
        className="max-sm:w-8 max-sm:px-0"
        render={
          <Link
            to="/workspaces/$workspace/tables/$table/new"
            params={{ workspace, table }}
            search={(previous) => previous}
          />
        }
      >
        <PlusIcon />
        <span className="max-sm:hidden">New record</span>
      </Button>
    ),
    menu,
  ].filter(Boolean);

  return (
    <div className="flex items-center gap-2">
      {showViews && <ViewsMenu workspace={workspace} table={table} />}
      <Group>
        {parts.flatMap((part, index) =>
          index === 0 ? [part] : [<GroupSeparator key={`separator-${index}`} />, part],
        )}
      </Group>
    </div>
  );
}
