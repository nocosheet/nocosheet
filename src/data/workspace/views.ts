import { mutationOptions, queryOptions } from "@tanstack/react-query";

import { fetch } from "void/client";

import type { ResolvedRecordsQuery } from "@/lib/records/query";
import type { TrashQuery } from "@/lib/trash/query";
import type { ViewsQuery } from "@/lib/views/query";
import type { ViewInput, ViewPatchInput } from "@/lib/views/validation";

import { unwrapFetch } from "./api-error";
import { workspaceKeys } from "./keys";

export const viewsQueryOptions = (workspace: string, tableId: number) =>
  queryOptions({
    queryKey: workspaceKeys.views(tableId),
    queryFn: () =>
      unwrapFetch(
        fetch("/api/w/:workspace/tables/:id/views", {
          params: { workspace, id: String(tableId) },
        }),
      ),
    staleTime: 30_000,
    retry: false,
  });

export const viewsPageQueryOptions = (workspace: string, tableId: number, query: ViewsQuery) =>
  queryOptions({
    queryKey: workspaceKeys.viewList(tableId, query),
    queryFn: () =>
      unwrapFetch(
        fetch("/api/w/:workspace/tables/:id/views/list", {
          params: { workspace, id: String(tableId) },
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
    retry: false,
  });

export const viewRecordsQueryOptions = (
  workspace: string,
  tableId: number,
  viewId: number,
  query: ResolvedRecordsQuery,
) =>
  queryOptions({
    queryKey: workspaceKeys.records(tableId, { view: viewId, ...query }),
    queryFn: () =>
      unwrapFetch(
        fetch("/api/w/:workspace/tables/:id/views/:view/records", {
          params: { workspace, id: String(tableId), view: String(viewId) },
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

export const createViewMutationOptions = mutationOptions({
  mutationKey: workspaceKeys.mutation("create-view"),
  mutationFn: ({
    workspace,
    tableId,
    ...values
  }: { workspace: string; tableId: number } & ViewInput) =>
    unwrapFetch(
      fetch("/api/w/:workspace/tables/:id/views", {
        method: "POST",
        params: { workspace, id: String(tableId) },
        body: values,
      }),
    ),
});

export const updateViewMutationOptions = mutationOptions({
  mutationKey: workspaceKeys.mutation("update-view"),
  mutationFn: ({
    workspace,
    tableId,
    viewId,
    ...values
  }: { workspace: string; tableId: number; viewId: number } & ViewPatchInput) =>
    unwrapFetch(
      fetch("/api/w/:workspace/tables/:id/views/:view", {
        method: "PATCH",
        params: { workspace, id: String(tableId), view: String(viewId) },
        body: values,
      }),
    ),
});

export const deleteViewsMutationOptions = mutationOptions({
  mutationKey: workspaceKeys.mutation("delete-views"),
  mutationFn: ({
    workspace,
    tableId,
    ids,
  }: {
    workspace: string;
    tableId: number;
    ids: number[];
  }) =>
    unwrapFetch(
      fetch("/api/w/:workspace/tables/:id/views", {
        method: "DELETE",
        params: { workspace, id: String(tableId) },
        body: { ids },
      }),
    ),
});

export const deleteViewMutationOptions = mutationOptions({
  mutationKey: workspaceKeys.mutation("delete-view"),
  mutationFn: ({
    workspace,
    tableId,
    viewId,
  }: {
    workspace: string;
    tableId: number;
    viewId: number;
  }) =>
    unwrapFetch(
      fetch("/api/w/:workspace/tables/:id/views/:view", {
        method: "DELETE",
        params: { workspace, id: String(tableId), view: String(viewId) },
      }),
    ),
});

export const deletedViewsQueryOptions = (workspace: string, tableId: number, query: TrashQuery) =>
  queryOptions({
    queryKey: workspaceKeys.viewsTrash(tableId, query),
    queryFn: () =>
      unwrapFetch(
        fetch("/api/w/:workspace/tables/:id/views/trash", {
          params: { workspace, id: String(tableId) },
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

export const restoreViewMutationOptions = mutationOptions({
  mutationKey: workspaceKeys.mutation("restore-view"),
  mutationFn: ({
    workspace,
    tableId,
    viewId,
  }: {
    workspace: string;
    tableId: number;
    viewId: number;
  }) =>
    unwrapFetch(
      fetch("/api/w/:workspace/tables/:id/views/trash/:view/restore", {
        method: "POST",
        params: { workspace, id: String(tableId), view: String(viewId) },
      }),
    ),
});

export const purgeViewMutationOptions = mutationOptions({
  mutationKey: workspaceKeys.mutation("purge-view"),
  mutationFn: ({
    workspace,
    tableId,
    viewId,
  }: {
    workspace: string;
    tableId: number;
    viewId: number;
  }) =>
    unwrapFetch(
      fetch("/api/w/:workspace/tables/:id/views/trash/:view", {
        method: "DELETE",
        params: { workspace, id: String(tableId), view: String(viewId) },
      }),
    ),
});
