import { LayersIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Menu,
  MenuGroup,
  MenuGroupLabel,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu";
import { NamedIcon } from "@/components/workspace/tables/named-icon";

import type { ViewerColumn } from "./columns";

const NONE = "__none__";

export function RecordGroup({
  columns,
  value,
  onChange,
}: {
  columns: ViewerColumn[];
  value: string | null;
  onChange: (key: string | null) => void;
}) {
  const options = columns.filter((column) => column.groupFormat);
  const active = options.find((column) => column.key === value);
  if (options.length === 0) return null;

  return (
    <Menu>
      <MenuTrigger render={<Button variant="outline" />}>
        <LayersIcon />
        Group
        {active && <Badge variant="secondary">{active.name}</Badge>}
      </MenuTrigger>
      <MenuPopup align="start" className="min-w-56">
        <MenuGroup>
          <MenuGroupLabel>Group records by</MenuGroupLabel>
          <MenuRadioGroup
            value={active?.key ?? NONE}
            onValueChange={(next) => onChange(next === NONE ? null : String(next))}
          >
            <MenuRadioItem value={NONE} closeOnClick>
              No grouping
            </MenuRadioItem>
            <MenuSeparator />
            {options.map((column) => (
              <MenuRadioItem
                key={column.key}
                value={column.key}
                disabled={!column.groupable}
                closeOnClick
              >
                <span className="flex min-w-0 items-center gap-2">
                  <NamedIcon
                    name={column.icon}
                    fallback={column.formatIcon}
                    className="size-4 shrink-0 text-muted-foreground"
                  />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate">{column.name}</span>
                    {!column.groupable && (
                      <span className="text-muted-foreground text-xs">
                        Turn on Filterable in the column settings
                      </span>
                    )}
                  </span>
                </span>
              </MenuRadioItem>
            ))}
          </MenuRadioGroup>
        </MenuGroup>
      </MenuPopup>
    </Menu>
  );
}
