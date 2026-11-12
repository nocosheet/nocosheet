import { useQuery, useSuspenseQuery } from "@tanstack/react-query";

import { SettingsRow } from "@/components/shared/settings-row";
import {
  Card,
  CardFrame,
  CardFrameDescription,
  CardFrameHeader,
  CardFrameTitle,
  CardPanel,
} from "@/components/ui/card";
import { columnExpressionsQueryOptions, tableQueryOptions } from "@/data/workspace/tables";

import { ColumnsList } from "./columns-list";
import { NamedIcon } from "./named-icon";

const ID_TYPE_LABELS = { increment: "Auto-increment number", uuid: "UUID" } as const;

export function TableDefinitionView({
  workspace,
  tableId,
}: {
  workspace: string;
  tableId: number;
}) {
  const { data: table } = useSuspenseQuery(tableQueryOptions(workspace, tableId));
  const { data: expressions } = useQuery(columnExpressionsQueryOptions(workspace, tableId));

  const titleColumn = table.columns.find((column) => column.id === table.titleColumnId);

  return (
    <div className="flex flex-col gap-6">
      <CardFrame>
        <CardFrameHeader>
          <CardFrameTitle>{table.name}</CardFrameTitle>
          <CardFrameDescription>
            How this table is set up. Only admins can edit it.
          </CardFrameDescription>
        </CardFrameHeader>
        <Card>
          <SettingsRow title="Name" description="How the table is labelled in the app.">
            <span className="flex items-center gap-2 text-sm">
              <NamedIcon name={table.icon} className="size-4 text-muted-foreground" />
              {table.name}
            </span>
          </SettingsRow>
          <SettingsRow title="Stored as" description="The table's name in the database.">
            <code className="font-mono text-sm">{table.tableName}</code>
          </SettingsRow>
          <SettingsRow title="Group" description="Where the table is listed in the sidebar.">
            <span className="text-sm">{table.groupName ?? "No group"}</span>
          </SettingsRow>
          <SettingsRow title="Description" description="What the table is for.">
            <span className="text-sm">{table.description ?? "—"}</span>
          </SettingsRow>
          <SettingsRow title="Title column" description="Names each record and shows in links.">
            <span className="text-sm">{titleColumn?.name ?? "Records are shown by id"}</span>
          </SettingsRow>
          <SettingsRow title="Record id" description="How records are identified.">
            <span className="text-sm">{ID_TYPE_LABELS[table.idType]}</span>
          </SettingsRow>
        </Card>
      </CardFrame>

      <CardFrame>
        <CardFrameHeader>
          <CardFrameTitle>Columns</CardFrameTitle>
          <CardFrameDescription>
            {table.columns.length} {table.columns.length === 1 ? "column" : "columns"}
          </CardFrameDescription>
        </CardFrameHeader>
        <Card>
          <CardPanel>
            <ColumnsList
              columns={table.columns}
              expressions={expressions}
              titleColumnId={table.titleColumnId}
              empty="This table has no columns yet."
            />
          </CardPanel>
        </Card>
      </CardFrame>
    </div>
  );
}
