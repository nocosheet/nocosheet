import type { ReactNode } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { trashExpiry } from "@/lib/records/retention";

import { NamedIcon } from "../tables/named-icon";
import { TrashEmpty } from "./trash-empty";

export type TrashRow = {
  id: number;
  name: string;
  icon?: string | null;
  deletedAt: number;
  deletedBy: { id: string; label: string | null } | null;
};

function When({ at }: { at: number }) {
  return (
    <span className="text-muted-foreground" title={new Date(at).toLocaleString()}>
      {formatRelativeTime(at)}
    </span>
  );
}

export function TrashRows<TRow extends TrashRow>({
  rows,
  nameLabel,
  detail,
  actions,
  loading,
  error,
  emptyDescription,
}: {
  rows: TRow[] | undefined;
  nameLabel: string;
  detail?: (row: TRow) => ReactNode;
  actions: (row: TRow) => ReactNode;
  loading: boolean;
  error: Error | null;
  emptyDescription: string;
}) {
  if (error)
    return (
      <Alert variant="error">
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );

  if (!rows)
    return loading ? (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    ) : null;

  if (rows.length === 0) return <TrashEmpty description={emptyDescription} />;

  return (
    <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{nameLabel}</TableHead>
            <TableHead>Deleted</TableHead>
            <TableHead>Deleted forever</TableHead>
            <TableHead>Deleted by</TableHead>
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id} className="hover:bg-accent!">
              <TableCell>
                <div className="flex items-center gap-3">
                  <NamedIcon name={row.icon ?? null} className="size-4 shrink-0 text-muted-foreground" />
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate font-medium">{row.name}</span>
                    {detail?.(row)}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <When at={row.deletedAt} />
              </TableCell>
              <TableCell>
                <When at={trashExpiry(row.deletedAt)} />
              </TableCell>
              <TableCell>
                {row.deletedBy?.label ?? <span className="text-muted-foreground">—</span>}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">{actions(row)}</div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
    </Table>
  );
}
