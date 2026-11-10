import { Link } from "@tanstack/react-router";

import { UserRoundXIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { DEFAULT_WORKSPACE } from "@/lib/workspace";

export function MemberNotFound() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <UserRoundXIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>Member not found</EmptyTitle>
        <EmptyDescription>This account doesn't exist or was removed.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button
          variant="outline"
          render={
            <Link to="/w/$workspace/settings/members" params={{ workspace: DEFAULT_WORKSPACE }} />
          }
        >
          Back to members
        </Button>
      </EmptyContent>
    </Empty>
  );
}
