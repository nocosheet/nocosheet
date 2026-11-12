import { Link } from "@tanstack/react-router";

import { PlusIcon, TableIcon } from "lucide-react";

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
          <EmptyTitle>No tables yet</EmptyTitle>
          <EmptyDescription>
            Create a table, define its columns and start modeling your data without code.
          </EmptyDescription>
        </EmptyHeader>
        <Button
          render={
            <Link to="/workspaces/$workspace/tables/new" params={{ workspace }} search={{ step: 1 }} />
          }
        >
          <PlusIcon />
          New table
        </Button>
      </Empty>
    </Card>
  );
}
