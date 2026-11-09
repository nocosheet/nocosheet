import { Link } from "@tanstack/react-router";

import { TableIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export function TablesEmpty({ workspace }: { workspace: string }) {
  return (
    <Card>
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <TableIcon />
          </EmptyMedia>
          <EmptyTitle>Tables are coming soon</EmptyTitle>
          <EmptyDescription>
            Create tables, add records and build views here, so you can model your data without
            code.
          </EmptyDescription>
        </EmptyHeader>
        <Button variant="outline" render={<Link to="/w/$workspace" params={{ workspace }} />}>
          Back to overview
        </Button>
      </Empty>
    </Card>
  );
}
