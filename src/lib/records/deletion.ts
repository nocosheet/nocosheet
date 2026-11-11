import { classifyDbError } from "../db-errors";
import type { Column, Table } from "../tables/repository";
import { listColumns } from "../tables/repository";
import {
  findLinkedIds,
  findRows,
  listReferencingColumns,
  type Snapshot,
  trashAndDeleteRows,
} from "./trash-repository";

export async function planDeletion(
  workspace: string,
  table: Table,
  ids: unknown[],
  seen: Set<string> = new Set(),
  plan: Snapshot[] = [],
  columns?: Column[],
) {
  const fresh = ids.filter((id) => !seen.has(`${table.id}:${String(id)}`));
  fresh.forEach((id) => seen.add(`${table.id}:${String(id)}`));
  if (fresh.length === 0) return plan;

  const rows = await findRows(workspace, table, columns ?? (await listColumns(table.id)), fresh);
  if (rows.length === 0) return plan;
  plan.push({ table, rows });

  for (const { column, table: source } of await listReferencingColumns(table.id)) {
    if ((column.options as { onDelete?: string }).onDelete !== "cascade") continue;
    const linked = await findLinkedIds(
      workspace,
      source,
      column,
      rows.map((row) => row.id),
    );
    await planDeletion(workspace, source, linked, seen, plan);
  }

  return plan;
}

export type DeleteResult =
  | { ok: true; trash: number[] }
  | { ok: false; reason: "not_found" | "linked" | "failed"; message: string };

export async function deleteRecords(
  workspace: string,
  table: Table,
  ids: (string | number)[],
  userId: string,
): Promise<DeleteResult> {
  const plan = await planDeletion(workspace, table, [...new Set(ids)]);
  const top = plan[0];
  if (!top) return { ok: false, reason: "not_found", message: "Record not found." };

  try {
    const trash = await trashAndDeleteRows(
      workspace,
      table,
      plan,
      top.rows.map((row) => row.id),
      userId,
    );
    return { ok: true, trash };
  } catch (error) {
    const failure = classifyDbError(error);
    return failure.kind === "foreign_key"
      ? {
          ok: false,
          reason: "linked",
          message: "Some of these records are still linked from other records.",
        }
      : { ok: false, reason: "failed", message: failure.message };
  }
}
