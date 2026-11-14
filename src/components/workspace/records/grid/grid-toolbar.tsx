import { useEffect, useState } from "react";

import { SearchIcon } from "lucide-react";

import { DataTableViewOptions } from "@/components/shared/data-table/data-table-view-options";
import { Input } from "@/components/ui/input";
import { toColumnFilters } from "@/lib/records/column-filters";

import type { ViewerColumn } from "../columns";
import { RecordFilters } from "../record-filters";
import type { GridTable } from "./use-grid-table";
import type { RecordsQuery } from "./use-records-query";

export function GridToolbar({
  grid,
  columns,
  query,
}: {
  grid: GridTable;
  columns: ViewerColumn[];
  query: RecordsQuery;
}) {
  const searchable = columns.some((column) => column.searchable);
  const [search, setSearch] = useState(query.q);
  useEffect(() => setSearch(query.q), [query.q]);
  useEffect(() => {
    if (search === query.q) return;
    const timeout = setTimeout(() => grid.setGlobalFilter(search), 300);
    return () => clearTimeout(timeout);
  }, [search, query.q, grid]);

  return (
    <div className="flex flex-wrap items-center gap-2 border-t px-4 py-2">
      {searchable && (
        <div className="relative w-full sm:w-72">
          <SearchIcon className="pointer-events-none absolute start-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            aria-label="Search records"
            placeholder="Search records"
            className="ps-9"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      )}
      <RecordFilters
        columns={columns}
        value={query.filters}
        onApply={(filters) => grid.setColumnFilters(toColumnFilters(filters))}
      />
      <div className="ms-auto flex items-center gap-2">
        <DataTableViewOptions table={grid} />
      </div>
    </div>
  );
}
