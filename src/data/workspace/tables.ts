import { mutationOptions, queryOptions } from "@tanstack/react-query";

import { fetch } from "void/client";

import type { TablesQuery } from "@/lib/tables/query";
import type {
  ColumnInput,
  ColumnPatchInput,
  TableInput,
  TableUpdateInput,
} from "@/lib/tables/validation";

import { unwrapFetch } from "./api-error";
import { workspaceKeys } from "./keys";

export const tablesQueryOptions = (workspace: string, query: TablesQuery) =>
  queryOptions({
    queryKey: workspaceKeys.tableList(query),
    queryFn: () =>
      unwrapFetch(
        fetch("/api/workspaces/:workspace/tables", {
          params: { workspace },
          query: {
            page: query.page,
            pageSize: query.pageSize,
            sort: query.sort,
            order: query.order,
            ...(query.q ? { q: query.q } : {}),
          },
        }),
      ),
    staleTime: 30_000,
  });

export const tableQueryOptions = (workspace: string, id: number) =>
  queryOptions({
    queryKey: workspaceKeys.table(id),
    queryFn: () =>
      unwrapFetch(fetch("/api/workspaces/:workspace/tables/:table", { params: { workspace, table: String(id) } })),
    staleTime: 30_000,
  });

export const createTableMutationOptions = mutationOptions({
  mutationKey: workspaceKeys.mutation("create-table"),
  mutationFn: ({ workspace, ...values }: { workspace: string } & TableInput) =>
    unwrapFetch(
      fetch("/api/workspaces/:workspace/tables", { method: "POST", params: { workspace }, body: values }),
    ),
});

export const deleteTablesMutationOptions = mutationOptions({
  mutationKey: workspaceKeys.mutation("delete-tables"),
  mutationFn: ({
    workspace,
    ids,
    permanent,
  }: {
    workspace: string;
    ids: number[];
    permanent?: boolean;
  }) =>
    unwrapFetch(
      fetch("/api/workspaces/:workspace/tables", {
        method: "DELETE",
        params: { workspace },
        body: permanent ? { ids, permanent } : { ids },
      }),
    ),
});

export const discardTableMutationOptions = mutationOptions({
  mutationKey: workspaceKeys.mutation("discard-table"),
  mutationFn: ({ workspace, id }: { workspace: string; id: number }) =>
    unwrapFetch(
      fetch("/api/workspaces/:workspace/tables", {
        method: "DELETE",
        params: { workspace },
        body: { ids: [id], permanent: true },
      }),
    ),
});

export const deletedTablesQueryOptions = (workspace: string) =>
  queryOptions({
    queryKey: workspaceKeys.tablesTrash(),
    queryFn: () =>
      unwrapFetch(fetch("/api/workspaces/:workspace/tables/trash", { params: { workspace } })),
    staleTime: 15_000,
    retry: false,
  });

export const restoreTableMutationOptions = mutationOptions({
  mutationKey: workspaceKeys.mutation("restore-table"),
  mutationFn: ({ workspace, id }: { workspace: string; id: number }) =>
    unwrapFetch(
      fetch("/api/workspaces/:workspace/tables/trash/:table/restore", {
        method: "POST",
        params: { workspace, table: String(id) },
      }),
    ),
});

export const purgeTableMutationOptions = mutationOptions({
  mutationKey: workspaceKeys.mutation("purge-table"),
  mutationFn: ({ workspace, id }: { workspace: string; id: number }) =>
    unwrapFetch(
      fetch("/api/workspaces/:workspace/tables/trash/:table", {
        method: "DELETE",
        params: { workspace, table: String(id) },
      }),
    ),
});

export const updateTableMutationOptions = mutationOptions({
  mutationKey: workspaceKeys.mutation("update-table"),
  mutationFn: ({
    workspace,
    id,
    values,
  }: {
    workspace: string;
    id: number;
    values: TableUpdateInput;
  }) =>
    unwrapFetch(
      fetch("/api/workspaces/:workspace/tables/:table", {
        method: "PATCH",
        params: { workspace, table: String(id) },
        body: values,
      }),
    ),
});

export const createColumnMutationOptions = mutationOptions({
  mutationKey: workspaceKeys.mutation("create-column"),
  mutationFn: ({ workspace, id, column }: { workspace: string; id: number; column: ColumnInput }) =>
    unwrapFetch(
      fetch("/api/workspaces/:workspace/tables/:table/columns", {
        method: "POST",
        params: { workspace, table: String(id) },
        body: column,
      }),
    ),
});

export const updateColumnMutationOptions = mutationOptions({
  mutationKey: workspaceKeys.mutation("update-column"),
  mutationFn: ({
    workspace,
    id,
    columnId,
    patch,
  }: {
    workspace: string;
    id: number;
    columnId: number;
    patch: ColumnPatchInput;
  }) =>
    unwrapFetch(
      fetch("/api/workspaces/:workspace/tables/:table/columns/:column", {
        method: "PATCH",
        params: { workspace, table: String(id), column: String(columnId) },
        body: patch,
      }),
    ),
});

export const reorderColumnsMutationOptions = mutationOptions({
  mutationKey: workspaceKeys.mutation("reorder-columns"),
  mutationFn: ({ workspace, id, ids }: { workspace: string; id: number; ids: number[] }) =>
    unwrapFetch(
      fetch("/api/workspaces/:workspace/tables/:table/columns/order", {
        method: "PUT",
        params: { workspace, table: String(id) },
        body: { ids },
      }),
    ),
});

export const deleteColumnMutationOptions = mutationOptions({
  mutationKey: workspaceKeys.mutation("delete-column"),
  mutationFn: ({ workspace, id, columnId }: { workspace: string; id: number; columnId: number }) =>
    unwrapFetch(
      fetch("/api/workspaces/:workspace/tables/:table/columns/:column", {
        method: "DELETE",
        params: { workspace, table: String(id), column: String(columnId) },
      }),
    ),
});

export const deletedColumnsQueryOptions = (workspace: string, id: number) =>
  queryOptions({
    queryKey: workspaceKeys.columnsTrash(id),
    queryFn: () =>
      unwrapFetch(
        fetch("/api/workspaces/:workspace/tables/:table/columns/trash", {
          params: { workspace, table: String(id) },
        }),
      ),
  });

export const restoreColumnMutationOptions = mutationOptions({
  mutationKey: workspaceKeys.mutation("restore-column"),
  mutationFn: ({ workspace, id, columnId }: { workspace: string; id: number; columnId: number }) =>
    unwrapFetch(
      fetch("/api/workspaces/:workspace/tables/:table/columns/trash/:column/restore", {
        method: "POST",
        params: { workspace, table: String(id), column: String(columnId) },
      }),
    ),
});

export const purgeColumnMutationOptions = mutationOptions({
  mutationKey: workspaceKeys.mutation("purge-column"),
  mutationFn: ({ workspace, id, columnId }: { workspace: string; id: number; columnId: number }) =>
    unwrapFetch(
      fetch("/api/workspaces/:workspace/tables/:table/columns/trash/:column", {
        method: "DELETE",
        params: { workspace, table: String(id), column: String(columnId) },
      }),
    ),
});
