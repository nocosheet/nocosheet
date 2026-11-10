import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { FileSpreadsheetIcon, LayoutTemplateIcon, PlusIcon, UserPlusIcon } from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardFrame,
  CardFrameAction,
  CardFrameDescription,
  CardFrameHeader,
  CardFrameTitle,
  CardPanel,
} from "@/components/ui/card";
import { toastManager } from "@/components/ui/toast";
import { membersQueryOptions } from "@/data/workspace/members";
import { useSession } from "@/hooks/use-session";
import { useWorkspace } from "@/hooks/use-workspace";
import { getInitials } from "@/lib/initials";
import { usePlaceholderTables } from "@/lib/placeholder-tables-store";

const START_ACTIONS = [
  {
    icon: PlusIcon,
    title: "New table",
    description: "Start from scratch with your own fields.",
  },
  {
    icon: FileSpreadsheetIcon,
    title: "Import data",
    description: "Bring in a CSV or spreadsheet as a table.",
  },
  {
    icon: LayoutTemplateIcon,
    title: "Use a template",
    description: "Begin with a ready-made CRM, tracker or inventory.",
  },
] as const;

const MAX_AVATARS = 5;

export function WorkspaceOverview({ workspace }: { workspace: string }) {
  const { data: members } = useSuspenseQuery(membersQueryOptions);
  const session = useSession();
  const { isAdmin } = useWorkspace();
  const tables = usePlaceholderTables();

  const firstName = session?.user.name?.split(" ")[0];
  const shownMembers = members.slice(0, MAX_AVATARS);
  const extraMembers = members.length - shownMembers.length;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="font-semibold text-2xl tracking-tight">
          Welcome back{firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="text-muted-foreground text-sm">
          Pick up where you left off, or start something new.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        {START_ACTIONS.map(({ icon: Icon, title, description }) => (
          <Card
            key={title}
            render={<button type="button" />}
            className="cursor-pointer gap-3 p-5 text-start transition-colors hover:bg-accent/40"
            onClick={() =>
              toastManager.add({
                type: "info",
                title: `${title} is coming soon`,
                description,
              })
            }
          >
            <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Icon className="size-4.5" />
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="font-medium text-sm">{title}</span>
              <span className="text-muted-foreground text-sm">{description}</span>
            </div>
          </Card>
        ))}
      </section>

      <CardFrame>
        <CardFrameHeader>
          <CardFrameTitle>Recent tables</CardFrameTitle>
          <CardFrameDescription>Jump back into what you worked on last.</CardFrameDescription>
          <CardFrameAction>
            <Button
              variant="ghost"
              size="sm"
              render={<Link to="/w/$workspace/tables" params={{ workspace }} />}
            >
              View all
            </Button>
          </CardFrameAction>
        </CardFrameHeader>
        <Card>
          {tables.slice(0, 5).map(({ id, name, icon: Icon, records, updated }) => (
            <Link
              key={id}
              to="/w/$workspace/tables"
              params={{ workspace }}
              className="flex items-center gap-3 p-4 transition-colors not-last:border-b hover:bg-accent/40 md:px-6"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Icon className="size-4" />
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-medium text-sm">{name}</span>
                <span className="text-muted-foreground text-xs">
                  {records.toLocaleString()} records
                </span>
              </div>
              <span className="shrink-0 text-muted-foreground text-xs">Edited {updated}</span>
            </Link>
          ))}
          {tables.length === 0 && (
            <CardPanel className="text-center text-muted-foreground text-sm">
              No tables yet. Create one to get started.
            </CardPanel>
          )}
        </Card>
      </CardFrame>

      <CardFrame>
        <CardFrameHeader>
          <CardFrameTitle>Team</CardFrameTitle>
          <CardFrameDescription>People who have access to this workspace.</CardFrameDescription>
        </CardFrameHeader>
        <Card>
          <CardPanel className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AvatarGroup>
                {shownMembers.map((member) => (
                  <Avatar key={member.id}>
                    {member.image && <AvatarImage src={member.image} alt="" />}
                    <AvatarFallback>{getInitials(member.name) || "U"}</AvatarFallback>
                  </Avatar>
                ))}
                {extraMembers > 0 && <AvatarGroupCount>+{extraMembers}</AvatarGroupCount>}
              </AvatarGroup>
              <span className="text-muted-foreground text-sm">
                {members.length} {members.length === 1 ? "member" : "members"}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              render={<Link to="/w/$workspace/settings/members" params={{ workspace }} />}
            >
              {isAdmin ? (
                <>
                  <UserPlusIcon />
                  Invite people
                </>
              ) : (
                "View members"
              )}
            </Button>
          </CardPanel>
        </Card>
      </CardFrame>
    </div>
  );
}
