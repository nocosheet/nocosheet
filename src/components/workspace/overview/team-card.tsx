import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { UserPlusIcon } from "lucide-react";

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
  CardFrameDescription,
  CardFrameHeader,
  CardFrameTitle,
  CardPanel,
} from "@/components/ui/card";
import { membersQueryOptions } from "@/data/workspace/members";
import { useAccess } from "@/hooks/use-access";
import { getInitials } from "@/lib/initials";

const MAX_AVATARS = 6;

export function TeamCard({ workspace }: { workspace: string }) {
  const { data: members } = useSuspenseQuery(membersQueryOptions);
  const access = useAccess();
  const shown = members.slice(0, MAX_AVATARS);
  const extra = members.length - shown.length;

  return (
    <CardFrame>
      <CardFrameHeader>
        <CardFrameTitle>Team</CardFrameTitle>
        <CardFrameDescription>People who have access to this workspace.</CardFrameDescription>
      </CardFrameHeader>
      <Card>
        <CardPanel className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AvatarGroup>
              {shown.map((member) => (
                <Avatar key={member.id}>
                  {member.image && <AvatarImage src={member.image} alt="" />}
                  <AvatarFallback>{getInitials(member.name) || "U"}</AvatarFallback>
                </Avatar>
              ))}
              {extra > 0 && <AvatarGroupCount>+{extra}</AvatarGroupCount>}
            </AvatarGroup>
            <span className="text-muted-foreground text-sm">
              {members.length} {members.length === 1 ? "member" : "members"}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            render={<Link to="/workspaces/$workspace/settings/members" params={{ workspace }} />}
          >
            {access.admin ? (
              <>
                <UserPlusIcon />
                Manage members
              </>
            ) : (
              "View members"
            )}
          </Button>
        </CardPanel>
      </Card>
    </CardFrame>
  );
}
