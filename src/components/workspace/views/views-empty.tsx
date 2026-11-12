import { LayoutGridIcon, PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { useAccess } from "@/hooks/use-access";

export function ViewsEmpty({ onCreate }: { onCreate: () => void }) {
  const access = useAccess();

  return (
    <Card>
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <LayoutGridIcon />
          </EmptyMedia>
          <EmptyTitle>No views yet</EmptyTitle>
          <EmptyDescription>
            {access.admin
              ? "A view shows a chosen set of columns and only the records that match its filters."
              : "An administrator can create views of this table."}
          </EmptyDescription>
        </EmptyHeader>
        {access.admin && (
          <Button onClick={onCreate}>
            <PlusIcon />
            New view
          </Button>
        )}
      </Empty>
    </Card>
  );
}
