import { useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";

import {
  ArchiveRestoreIcon,
  CheckIcon,
  ChevronDownIcon,
  LayoutGridIcon,
  ListIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Menu,
  MenuItem,
  MenuLinkItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu";
import { viewsQueryOptions } from "@/data/workspace/views";
import { useAccess } from "@/hooks/use-access";

import { NamedIcon } from "../tables/named-icon";
import { DeleteViewDialog } from "./delete-view-dialog";
import { ViewDialog } from "./view-dialog";

type Dialog = "create" | "edit" | "delete" | null;

export function ViewsMenu({
  workspace,
  table,
  activeView,
}: {
  workspace: string;
  table: string;
  activeView?: number;
}) {
  const tableId = Number(table);
  const access = useAccess();
  const navigate = useNavigate();
  const { data: views = [] } = useQuery(viewsQueryOptions(workspace, tableId));
  const [dialog, setDialog] = useState<Dialog>(null);
  const active = views.find((view) => view.id === activeView);

  return (
    <>
      <Menu>
        <MenuTrigger render={<Button size="sm" variant="outline" aria-label="Views" />}>
          <LayoutGridIcon />
          <span className="max-w-40 truncate max-sm:hidden">{active?.name ?? "All records"}</span>
          <ChevronDownIcon />
        </MenuTrigger>
        <MenuPopup align="start" className="min-w-52">
          <MenuLinkItem
            render={<Link to="/w/$workspace/tables/$table" params={{ workspace, table }} />}
          >
            All records
            {!active && <CheckIcon className="ms-auto" />}
          </MenuLinkItem>
          {views.map((view) => (
            <MenuLinkItem
              key={view.id}
              render={
                <Link
                  to="/w/$workspace/tables/$table/view/$view"
                  params={{ workspace, table, view: String(view.id) }}
                />
              }
            >
              <NamedIcon
                name={view.icon}
                fallback={LayoutGridIcon}
                className="size-4 shrink-0 text-muted-foreground"
              />
              <span className="truncate">{view.name}</span>
              {view.id === activeView && <CheckIcon className="ms-auto" />}
            </MenuLinkItem>
          ))}
          <MenuSeparator />
          <MenuLinkItem
            render={<Link to="/w/$workspace/tables/$table/view" params={{ workspace, table }} />}
          >
            <ListIcon />
            All views
          </MenuLinkItem>
          {access.admin && (
            <>
              <MenuItem onClick={() => setDialog("create")}>
                <PlusIcon />
                Create view
              </MenuItem>
              {active && (
                <>
                  <MenuItem onClick={() => setDialog("edit")}>
                    <PencilIcon />
                    Edit view
                  </MenuItem>
                  <MenuItem variant="destructive" onClick={() => setDialog("delete")}>
                    <Trash2Icon />
                    Delete view
                  </MenuItem>
                </>
              )}
              <MenuLinkItem
                render={
                  <Link to="/w/$workspace/tables/$table/view/trash" params={{ workspace, table }} />
                }
              >
                <ArchiveRestoreIcon />
                Deleted views
              </MenuLinkItem>
            </>
          )}
        </MenuPopup>
      </Menu>
      {access.admin && (
        <ViewDialog
          workspace={workspace}
          tableId={tableId}
          open={dialog === "create" || dialog === "edit"}
          onOpenChange={(open) => !open && setDialog(null)}
          view={dialog === "edit" ? active : undefined}
        />
      )}
      {access.admin && active && (
        <DeleteViewDialog
          workspace={workspace}
          tableId={tableId}
          view={active}
          open={dialog === "delete"}
          onOpenChange={(open) => !open && setDialog(null)}
          onDeleted={() =>
            void navigate({ to: "/w/$workspace/tables/$table", params: { workspace, table } })
          }
        />
      )}
    </>
  );
}
