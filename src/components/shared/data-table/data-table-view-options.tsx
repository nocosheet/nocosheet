import type { ReactTable, RowData } from "@tanstack/react-table";

import { Settings2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Menu,
  MenuCheckboxItem,
  MenuGroup,
  MenuGroupLabel,
  MenuPopup,
  MenuTrigger,
} from "@/components/ui/menu";

import type { dataTableFeatures } from "./features";

export function DataTableViewOptions<TData extends RowData, TSelected>({
  table,
}: {
  table: ReactTable<typeof dataTableFeatures, TData, TSelected>;
}) {
  const columns = table.getAllColumns().filter((column) => column.getCanHide());

  return (
    <Menu>
      <MenuTrigger render={<Button variant="outline" />}>
        <Settings2Icon />
        View
      </MenuTrigger>
      <MenuPopup align="end">
        <MenuGroup>
          <MenuGroupLabel>Columns</MenuGroupLabel>
          {columns.map((column) => (
            <MenuCheckboxItem
              key={column.id}
              checked={column.getIsVisible()}
              closeOnClick={false}
              onCheckedChange={(value) => column.toggleVisibility(!!value)}
            >
              {column.columnDef.meta?.label ?? column.id}
            </MenuCheckboxItem>
          ))}
        </MenuGroup>
      </MenuPopup>
    </Menu>
  );
}
