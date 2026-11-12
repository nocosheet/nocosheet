import { mutationOptions, queryOptions } from "@tanstack/react-query";

import { fetch } from "void/client";

import type { TrashQuery } from "@/lib/trash/query";

import { unwrapFetch } from "./api-error";
import { workspaceKeys } from "./keys";

export const trashQueryOptions = (workspace: string, tableId: number, query: TrashQuery) =>
  queryOptions({
    queryKey: workspaceKeys.trashList(tableId, query),
    queryFn: () =>
      unwrapFetch(
        fetch("/api/workspaces/:workspace/tables/:table/trash", {
          params: { workspace, table: String(tableId) },
          query: {
            page: query.page,
            pageSize: query.pageSize,
            sort: query.sort,
            order: query.order,
            ...(query.q ? { q: query.q } : {}),
          },
        }),
      ),
    staleTime: 15_000,
    retry: false,
  });

export const trashEntryQueryOptions = (workspace: string, tableId: number, entryId: number) =>
  queryOptions({
    queryKey: workspaceKeys.trashEntry(tableId, entryId),
    queryFn: () =>
      unwrapFetch(
        fetch("/api/workspaces/:workspace/tables/:table/trash/:entry", {
          params: { workspace, table: String(tableId), entry: String(entryId) },
        }),
      ),
    staleTime: 15_000,
    retry: false,
  });

export type RestoreFailure = { message: string; field?: string };

export const restoreRecord = ({
  workspace,
  tableId,
  entryId,
  values,
}: {
  workspace: string;
  tableId: number;
  entryId: number;
  values?: Record<string, unknown>;
}) =>
  unwrapFetch(
    fetch("/api/workspaces/:workspace/tables/:table/trash/:entry/restore", {
      method: "POST",
      params: { workspace, table: String(tableId), entry: String(entryId) },
      body: values ? { values } : {},
    }),
  );

export const restoreRecordMutationOptions = mutationOptions({
  mutationKey: workspaceKeys.mutation("restore-record"),
  mutationFn: restoreRecord,
});

export const purgeTrashMutationOptions = mutationOptions({
  mutationKey: workspaceKeys.mutation("purge-trash"),
  mutationFn: ({
    workspace,
    tableId,
    entryId,
  }: {
    workspace: string;
    tableId: number;
    entryId: number;
  }) =>
    unwrapFetch(
      fetch("/api/workspaces/:workspace/tables/:table/trash/:entry", {
        method: "DELETE",
        params: { workspace, table: String(tableId), entry: String(entryId) },
      }),
    ),
});
