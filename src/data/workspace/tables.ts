import { mutationOptions, queryOptions } from "@tanstack/react-query";

import { fetch } from "void/client";

import type { TablesQuery } from "@/lib/tables/query";
import type { ColumnInput, TableInput } from "@/lib/tables/validation";

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

export const deleteTableMutationOptions = mutationOptions({
  mutationKey: workspaceKeys.mutation("delete-table"),
  mutationFn: ({ workspace, id }: { workspace: string; id: number }) =>
    unwrapFetch(
      fetch("/api/w/:workspace/tables/:id", {
        method: "DELETE",
        params: { workspace, id: String(id) },
      }),
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

export const createColumnsMutationOptions = mutationOptions({
  mutationKey: workspaceKeys.mutation("create-columns"),
  mutationFn: ({
    workspace,
    id,
    columns,
    titleColumn,
  }: {
    workspace: string;
    id: number;
    columns: ColumnInput[];
    titleColumn: string | null;
  }) =>
    unwrapFetch(
      fetch("/api/w/:workspace/tables/:id/columns", {
        method: "POST",
        params: { workspace, id: String(id) },
        body: { columns, titleColumn },
      }),
    ),
});
