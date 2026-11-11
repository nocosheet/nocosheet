import { mutationOptions, queryOptions } from "@tanstack/react-query";

import { fetch } from "void/client";

import type { ResolvedRecordsQuery } from "@/lib/records/query";

import { unwrapFetch } from "./api-error";
import { workspaceKeys } from "./keys";

export const recordsQueryOptions = (
  workspace: string,
  tableId: number,
  query: ResolvedRecordsQuery,
) =>
  queryOptions({
    queryKey: workspaceKeys.records(tableId, query),
    queryFn: () =>
      unwrapFetch(
        fetch("/api/w/:workspace/tables/:id/records", {
          params: { workspace, id: String(tableId) },
          query: {
            page: query.page,
            pageSize: query.pageSize,
            ...(query.sort ? { sort: query.sort, order: query.order } : {}),
            ...(query.q ? { q: query.q } : {}),
            ...(query.group ? { group: query.group } : {}),
            ...(query.filters.length
              ? { filters: JSON.stringify(query.filters), join: query.join }
              : {}),
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
        fetch("/api/w/:workspace/tables/:id/records/:record", {
          params: { workspace, id: String(tableId), record: recordId },
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
        fetch("/api/w/:workspace/tables/:id/export", {
          params: { workspace, id: String(tableId) },
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
        fetch("/api/w/:workspace/tables/:id/options", {
          params: { workspace, id: String(tableId) },
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
      fetch("/api/w/:workspace/tables/:id/records", {
        method: "DELETE",
        params: { workspace, id: String(tableId) },
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
      fetch("/api/w/:workspace/tables/:id/records/:record", {
        method: "PATCH",
        params: { workspace, id: String(tableId), record: recordId },
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
      fetch("/api/w/:workspace/tables/:id/records", {
        method: "POST",
        params: { workspace, id: String(tableId) },
        body: { values },
      }),
    ),
});
