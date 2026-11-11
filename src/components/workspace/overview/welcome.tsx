import { Link } from "@tanstack/react-router";

import { PlusIcon, ShieldCheckIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAccess } from "@/hooks/use-access";
import { useSession } from "@/hooks/use-session";
import { useWorkspace } from "@/hooks/use-workspace";

export function Welcome({ workspace }: { workspace: string }) {
  const session = useSession();
  const { name } = useWorkspace();
  const access = useAccess();
  const firstName = session?.user.name?.split(" ")[0];

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="font-semibold text-2xl tracking-tight">
          Welcome back{firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
          <span>{name}</span>
          <Badge variant={access.admin ? "info" : "secondary"} size="sm">
            {access.admin ? "Administrator" : (access.role?.name ?? "Member")}
          </Badge>
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          render={<Link to="/w/$workspace/settings/role" params={{ workspace }} />}
        >
          <ShieldCheckIcon />
          Role & Permissions
        </Button>
        {access.admin && (
          <Button
            size="sm"
            render={
              <Link to="/w/$workspace/tables/new" params={{ workspace }} search={{ step: 1 }} />
            }
          >
            <PlusIcon />
            New table
          </Button>
        )}
      </div>
    </div>
  );
}
