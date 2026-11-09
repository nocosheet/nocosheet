import { useState } from "react";

import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { SearchIcon } from "lucide-react";

import { RoleBadge } from "@/components/shared/user-badges";
import { UserIdentity } from "@/components/shared/user-identity";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardFrame,
  CardFrameDescription,
  CardFrameHeader,
  CardFrameTitle,
} from "@/components/ui/card";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { membersQueryOptions } from "@/data/workspace/members";
import { formatRelativeTime } from "@/lib/format-relative-time";

export function MembersList({ workspace }: { workspace: string }) {
  const [query, setQuery] = useState("");
  const { data: members } = useSuspenseQuery(membersQueryOptions);

  const needle = query.trim().toLowerCase();
  const visible = needle
    ? members.filter(
        (member) =>
          member.name.toLowerCase().includes(needle) || member.email.toLowerCase().includes(needle),
      )
    : members;

  return (
    <CardFrame>
      <CardFrameHeader>
        <CardFrameTitle>Members</CardFrameTitle>
        <CardFrameDescription>
          Everyone with an account is a member of this workspace.
        </CardFrameDescription>
      </CardFrameHeader>
      <div className="px-6 pb-4">
        <InputGroup>
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            aria-label="Search members"
            placeholder="Search by name or email"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </InputGroup>
      </div>
      <Card>
        {visible.length === 0 ? (
          <p className="p-6 text-center text-muted-foreground text-sm">
            No members match your search.
          </p>
        ) : (
          visible.map((member) => (
            <Link
              key={member.id}
              to="/w/$workspace/settings/members/$userId"
              params={{ workspace, userId: member.id }}
              className="flex items-center justify-between gap-4 p-4 not-last:border-b hover:bg-accent/40 md:px-6"
            >
              <UserIdentity user={member} />
              <div className="flex shrink-0 items-center gap-3">
                <RoleBadge user={member} />
                <span className="hidden text-muted-foreground text-sm sm:inline">
                  Joined {formatRelativeTime(member.createdAt)}
                </span>
              </div>
            </Link>
          ))
        )}
      </Card>
    </CardFrame>
  );
}
