import type { Column } from "../tables/repository";
import { isStorableColumn, type Row } from "./trash-repository";
import type { ParsedValue } from "./values";

export function mergeSnapshot(
  columns: Column[],
  snapshot: Row,
  edits: ParsedValue<Column>[],
): ParsedValue<Column>[] {
  const edited = new Set(edits.map((edit) => edit.column.id));
  const kept = columns
    .filter(
      (column) =>
        isStorableColumn(column) && column.columnName in snapshot && !edited.has(column.id),
    )
    .map((column) => ({ column, value: snapshot[column.columnName] as string | number | null }));
  return [...kept, ...edits];
}

export function snapshotAuthors(snapshot: Row) {
  return [snapshot.created_by, snapshot.updated_by].filter(
    (value): value is string => typeof value === "string",
  );
}

export function restoredSystemValues(snapshot: Row, knownUsers: Set<string>) {
  const author = (value: unknown) =>
    typeof value === "string" && knownUsers.has(value) ? value : null;
  return {
    id: snapshot.id,
    created_at: snapshot.created_at,
    updated_at: snapshot.updated_at,
    created_by: author(snapshot.created_by),
    updated_by: author(snapshot.updated_by),
  };
}
