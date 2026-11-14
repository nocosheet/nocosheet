import { useEffect, useState } from "react";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { recordOptionsQueryOptions } from "@/data/workspace/records";

import type { ViewerColumn } from "./columns";

export type RelationItem = { value: string; label: string; id: number };

export function useRelationItems(workspace: string, column: ViewerColumn, search: string) {
  const targetId = Number(column.options.tableId);

  const [term, setTerm] = useState(search.trim());
  useEffect(() => {
    const timeout = setTimeout(() => setTerm(search.trim()), 250);
    return () => clearTimeout(timeout);
  }, [search]);

  const { data, isFetching } = useQuery({
    ...recordOptionsQueryOptions(workspace, targetId, term),
    placeholderData: keepPreviousData,
  });

  const items: RelationItem[] = (data ?? []).map((row) => ({
    value: String(row.id),
    label: row.label || `#${row.id}`,
    id: row.id,
  }));

  return { items, isFetching };
}
