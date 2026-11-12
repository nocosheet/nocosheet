import { Link } from "@tanstack/react-router";

import { PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAccess } from "@/hooks/use-access";

import { ViewsMenu } from "./views-menu";

export function ViewActions({
  workspace,
  table,
  view,
}: {
  workspace: string;
  table: string;
  view: number;
}) {
  const access = useAccess();

  return (
    <div className="flex items-center gap-2">
      <ViewsMenu workspace={workspace} table={table} activeView={view} />
      {access.can("create", Number(table)) && (
        <Button
          size="sm"
          variant="outline"
          aria-label="New record"
          className="max-sm:w-8 max-sm:px-0"
          render={
            <Link
              to="/workspaces/$workspace/tables/$table/views/$view/new"
              params={{ workspace, table, view: String(view) }}
              search={(previous) => previous}
            />
          }
        >
          <PlusIcon />
          <span className="max-sm:hidden">New record</span>
        </Button>
      )}
    </div>
  );
}
