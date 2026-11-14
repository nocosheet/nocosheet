import { mutationOptions, queryOptions } from "@tanstack/react-query";

import { fetch } from "void/client";

import { type ResolvedRecordsQuery, recordsKeyOf } from "@/lib/records/query";

import { unwrapFetch } from "./api-error";
import { workspaceKeys } from "./keys";

export const recordsQueryOptions = (
  workspace: string,
  tableId: number,
  query: ResolvedRecordsQuery,
) =>
  queryOptions({
    queryKey: workspaceKeys.records(tableId, recordsKeyOf(query)),
    queryFn: () =>
      unwrapFetch(
        fetch("/api/workspaces/:workspace/tables/:table/records", {
          params: { workspace, table: String(tableId) },
          query: {
            pageSize: query.pageSize,
            ...(query.cursor ? { cursor: query.cursor } : {}),
            ...(query.sort ? { sort: query.sort, order: query.order } : {}),
            ...(query.q ? { q: query.q } : {}),
            ...(query.filter ? { filter: query.filter } : {}),
          },
        }),
      ),
    staleTime: 15_000,
    retry: false,
  });

export const recordQueryOptions = (workspace: string, tableId: number, recordId: string) =>
  queryOptions({
    queryKey: workspaceKeys.record(tableId, recordId),
    queryFn: () =>
      unwrapFetch(
        fetch("/api/workspaces/:workspace/tables/:table/records/:record", {
          params: { workspace, table: String(tableId), record: recordId },
        }),
      ),
    staleTime: 15_000,
    retry: false,
  });

export const recordsExportQueryOptions = (workspace: string, tableId: number) =>
  queryOptions({
    queryKey: workspaceKeys.recordsExport(tableId),
    queryFn: () =>
      unwrapFetch(
        fetch("/api/workspaces/:workspace/tables/:table/export", {
          params: { workspace, table: String(tableId) },
        }),
      ),
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });

export const recordOptionsQueryOptions = (workspace: string, tableId: number, term: string) =>
  queryOptions({
    queryKey: workspaceKeys.recordOptions(tableId, term),
    queryFn: () =>
      unwrapFetch(
        fetch("/api/workspaces/:workspace/tables/:table/options", {
          params: { workspace, table: String(tableId) },
          query: term ? { q: term } : {},
        }),
      ),
    staleTime: 15_000,
    retry: false,
  });

export const deleteRecordsMutationOptions = mutationOptions({
  mutationKey: workspaceKeys.mutation("delete-records"),
  mutationFn: ({
    workspace,
    tableId,
    ids,
  }: {
    workspace: string;
    tableId: number;
    ids: (string | number)[];
  }) =>
    unwrapFetch(
      fetch("/api/workspaces/:workspace/tables/:table/records", {
        method: "DELETE",
        params: { workspace, table: String(tableId) },
        body: { ids },
      }),
    ),
});

export const updateRecordMutationOptions = mutationOptions({
  mutationKey: workspaceKeys.mutation("update-record"),
  mutationFn: ({
    workspace,
    tableId,
    recordId,
    values,
  }: {
    workspace: string;
    tableId: number;
    recordId: string;
    values: Record<string, unknown>;
  }) =>
    unwrapFetch(
      fetch("/api/workspaces/:workspace/tables/:table/records/:record", {
        method: "PATCH",
        params: { workspace, table: String(tableId), record: recordId },
        body: { values },
      }),
    ),
});

export const createRecordMutationOptions = mutationOptions({
  mutationKey: workspaceKeys.mutation("create-record"),
  mutationFn: ({
    workspace,
    tableId,
    values,
  }: {
    workspace: string;
    tableId: number;
    values: Record<string, unknown>;
  }) =>
    unwrapFetch(
      fetch("/api/workspaces/:workspace/tables/:table/records", {
        method: "POST",
        params: { workspace, table: String(tableId) },
        body: { values },
      }),
    ),
});

export const uploadFileMutationOptions = mutationOptions({
  mutationFn: ({
    workspace,
    tableId,
    column,
    file,
  }: {
    workspace: string;
    tableId: number;
    column: string;
    file: File;
  }) => {
    const body = new FormData();
    body.set("file", file);
    body.set("column", column);
    return unwrapFetch(
      fetch("/api/workspaces/:workspace/tables/:table/files", {
        method: "POST",
        params: { workspace, table: String(tableId) },
        body,
      }),
    );
  },
});
