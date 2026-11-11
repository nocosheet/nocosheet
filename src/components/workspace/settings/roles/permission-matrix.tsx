import { PlusIcon, XIcon } from "lucide-react";

import { SettingsRow } from "@/components/shared/settings-row";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardFrame,
  CardFrameDescription,
  CardFrameHeader,
  CardFrameTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NamedIcon } from "@/components/workspace/tables/named-icon";
import type { Matrix } from "@/lib/roles/matrix";
import { ACTIONS, type Action, PERMISSION_LABELS } from "@/lib/roles/permissions";

import { ScopeSelect, type ScopeValue } from "./scope-select";

const DESCRIPTIONS: Record<Action, string> = {
  create: "Add new records.",
  read: "See records and open their details.",
  update: "Change the values of records.",
  delete: "Move records to the trash.",
  export: "Download records as a CSV file.",
};

export type PermissionTable = { id: number; name: string; icon: string | null };

export function PermissionMatrix({
  matrix,
  tables,
  onChange,
}: {
  matrix: Matrix;
  tables: PermissionTable[];
  onChange: (matrix: Matrix) => void;
}) {
  const overridden = tables.filter((table) => matrix.tables[table.id]);
  const available = tables.filter((table) => !matrix.tables[table.id]);

  const setWorkspace = (action: Action, value: ScopeValue) =>
    value !== "inherit" &&
    onChange({ ...matrix, workspace: { ...matrix.workspace, [action]: value } });

  const setTable = (tableId: number, action: Action, value: ScopeValue) => {
    const row = { ...matrix.tables[tableId] };
    if (value === "inherit") delete row[action];
    else row[action] = value;
    onChange({ ...matrix, tables: { ...matrix.tables, [tableId]: row } });
  };

  const removeTable = (tableId: number) => {
    const { [tableId]: _removed, ...rest } = matrix.tables;
    onChange({ ...matrix, tables: rest });
  };

  return (
    <>
      <CardFrame>
        <CardFrameHeader>
          <CardFrameTitle>Workspace-wide permissions</CardFrameTitle>
          <CardFrameDescription>
            What this role can do in every table, unless a table below says otherwise. Changing
            table structure is always for administrators only.
          </CardFrameDescription>
        </CardFrameHeader>
        <Card>
          {ACTIONS.map((action) => (
            <SettingsRow
              key={action}
              title={PERMISSION_LABELS[action]}
              description={DESCRIPTIONS[action]}
            >
              <ScopeSelect
                action={action}
                label={PERMISSION_LABELS[action]}
                value={matrix.workspace[action]}
                onValueChange={(value) => setWorkspace(action, value)}
              />
            </SettingsRow>
          ))}
        </Card>
      </CardFrame>

      <CardFrame>
        <CardFrameHeader>
          <CardFrameTitle>Table overrides</CardFrameTitle>
          <CardFrameDescription>
            Give this role different permissions for specific tables. Anything left on "Same as
            workspace" follows the settings above.
          </CardFrameDescription>
        </CardFrameHeader>
        <Card>
          {overridden.length === 0 && (
            <p className="p-6 text-center text-muted-foreground text-sm">No table overrides yet.</p>
          )}
          {overridden.map((table) => (
            <div key={table.id} className="flex flex-col gap-3 p-4 not-last:border-b md:px-6">
              <div className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2 font-medium text-sm">
                  <NamedIcon name={table.icon} className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{table.name}</span>
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove overrides for ${table.name}`}
                  onClick={() => removeTable(table.id)}
                >
                  <XIcon />
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {ACTIONS.map((action) => (
                  <div key={action} className="flex flex-col gap-1">
                    <span className="text-muted-foreground text-xs">
                      {PERMISSION_LABELS[action]}
                    </span>
                    <ScopeSelect
                      inherit
                      action={action}
                      label={`${PERMISSION_LABELS[action]} in ${table.name}`}
                      value={matrix.tables[table.id]?.[action] ?? "inherit"}
                      onValueChange={(value) => setTable(table.id, action, value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
          {available.length > 0 && (
            <div className="p-4 md:px-6">
              <Select
                value=""
                items={available.map((table) => ({ value: String(table.id), label: table.name }))}
                onValueChange={(next) => {
                  if (next)
                    onChange({ ...matrix, tables: { ...matrix.tables, [Number(next)]: {} } });
                }}
              >
                <SelectTrigger aria-label="Add a table override" size="sm" className="w-fit">
                  <PlusIcon />
                  <SelectValue placeholder="Add a table override" />
                </SelectTrigger>
                <SelectPopup>
                  {available.map((table) => (
                    <SelectItem key={table.id} value={String(table.id)}>
                      {table.name}
                    </SelectItem>
                  ))}
                </SelectPopup>
              </Select>
            </div>
          )}
        </Card>
      </CardFrame>
    </>
  );
}
