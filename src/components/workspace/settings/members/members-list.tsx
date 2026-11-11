import { useState } from "react";

import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { CheckIcon, CopyIcon, SearchIcon } from "lucide-react";

import { RoleBadge } from "@/components/shared/user-badges";
import { UserIdentity } from "@/components/shared/user-identity";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardFrame,
  CardFrameDescription,
  CardFrameHeader,
  CardFrameTitle,
} from "@/components/ui/card";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { membersQueryOptions } from "@/data/workspace/members";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { useWorkspace } from "@/hooks/use-workspace";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { cn } from "@/lib/utils";

function CopyIdButton({ id }: { id: string }) {
  const { copyToClipboard, isCopied } = useCopyToClipboard();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      className="relative z-10"
      aria-label="Copy user ID"
      title="Copy user ID"
      onClick={() => copyToClipboard(id)}
    >
      {isCopied ? <CheckIcon /> : <CopyIcon />}
    </Button>
  );
}

export function MembersList({ workspace }: { workspace: string }) {
  const { isAdmin } = useWorkspace();
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
            <div
              key={member.id}
              className={cn(
                "relative flex items-center justify-between gap-4 p-4 not-last:border-b md:px-6",
                isAdmin && "hover:bg-accent/40",
              )}
            >
              {isAdmin ? (
                <Link
                  to="/w/$workspace/settings/members/$userId"
                  params={{ workspace, userId: member.id }}
                  className="min-w-0 after:absolute after:inset-0"
                >
                  <UserIdentity user={member} />
                </Link>
              ) : (
                <UserIdentity user={member} />
              )}
              <div className="flex shrink-0 items-center gap-3">
                <RoleBadge user={member} />
                <span
                  className="hidden w-36 text-end text-muted-foreground text-sm sm:inline-block"
                  title={`Joined ${new Date(member.createdAt).toLocaleString()}`}
                >
                  Joined {formatRelativeTime(member.createdAt)}
                </span>
                <CopyIdButton id={member.id} />
              </div>
            </div>
          ))
        )}
      </Card>
    </CardFrame>
  );
}
