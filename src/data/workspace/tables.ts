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
        fetch("/api/w/:workspace/tables", {
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
      unwrapFetch(fetch("/api/w/:workspace/tables/:id", { params: { workspace, id: String(id) } })),
    staleTime: 30_000,
  });

export const createTableMutationOptions = mutationOptions({
  mutationKey: workspaceKeys.mutation("create-table"),
  mutationFn: ({ workspace, ...values }: { workspace: string } & TableInput) =>
    unwrapFetch(
      fetch("/api/w/:workspace/tables", { method: "POST", params: { workspace }, body: values }),
    ),
});

export const deleteTablesMutationOptions = mutationOptions({
  mutationKey: workspaceKeys.mutation("delete-tables"),
  mutationFn: ({ workspace, ids }: { workspace: string; ids: number[] }) =>
    unwrapFetch(
      fetch("/api/w/:workspace/tables", {
        method: "DELETE",
        params: { workspace },
        body: { ids },
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
      fetch("/api/w/:workspace/tables/:id", {
        method: "PATCH",
        params: { workspace, id: String(id) },
        body: values,
      }),
    ),
});

export const createColumnMutationOptions = mutationOptions({
  mutationKey: workspaceKeys.mutation("create-column"),
  mutationFn: ({ workspace, id, column }: { workspace: string; id: number; column: ColumnInput }) =>
    unwrapFetch(
      fetch("/api/w/:workspace/tables/:id/columns", {
        method: "POST",
        params: { workspace, id: String(id) },
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
      fetch("/api/w/:workspace/tables/:id/columns/:column", {
        method: "PATCH",
        params: { workspace, id: String(id), column: String(columnId) },
        body: patch,
      }),
    ),
});

export const deleteColumnMutationOptions = mutationOptions({
  mutationKey: workspaceKeys.mutation("delete-column"),
  mutationFn: ({ workspace, id, columnId }: { workspace: string; id: number; columnId: number }) =>
    unwrapFetch(
      fetch("/api/w/:workspace/tables/:id/columns/:column", {
        method: "DELETE",
        params: { workspace, id: String(id), column: String(columnId) },
      }),
    ),
});
