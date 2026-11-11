import { Alert, AlertDescription } from "@/components/ui/alert";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Form } from "@/components/ui/form";
import { SheetDescription, SheetHeader, SheetPanel, SheetTitle } from "@/components/ui/sheet";
import { NamedIcon } from "@/components/workspace/tables/named-icon";
import type { FormValue } from "@/lib/records/form";

import { CellValue } from "../cells";
import type { ViewerColumn } from "../columns";
import { RecordInput } from "../record-input";
import type { RecordForm as RecordFormApi } from "./use-record-form";

type RecordData = Record<string, unknown>;

const SYSTEM_FORMATS = ["id", "created_at", "updated_at", "user"];

function StaticValue({ column, value }: { column: ViewerColumn; value: unknown }) {
  if (value === null || value === undefined || value === "")
    return <span className="text-muted-foreground">Empty</span>;
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1 *:min-w-0">
      <CellValue column={column} value={value} />
    </div>
  );
}

const formatWhen = (value: unknown) => {
  const date = new Date(value as number);
  return Number.isNaN(date.getTime())
    ? ""
    : new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
};

function Activity({ record }: { record: RecordData }) {
  const rows = [
    { label: "Created", at: record.created_at, by: record.created_by },
    { label: "Updated", at: record.updated_at, by: record.updated_by },
  ].filter((row) => row.at || row.by);
  if (rows.length === 0) return null;

  return (
    <dl className="flex flex-col gap-2 border-t pt-4 text-sm">
      {rows.map((row) => {
        const by = (row.by as { label?: string | null } | null)?.label;
        return (
          <div key={row.label} className="grid grid-cols-[5rem_minmax(0,1fr)] gap-3">
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className="min-w-0">
              {formatWhen(row.at)}
              {by && <span className="text-muted-foreground"> by {by}</span>}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

const textOf = (value: unknown) =>
  typeof value === "string" || typeof value === "number" ? String(value) : "";

function RecordFields({
  form,
  workspace,
  tableId,
  columns,
  record,
  disabled,
  error,
  fieldErrors,
  onFieldEdit,
}: {
  form: RecordFormApi;
  workspace: string;
  tableId: number;
  columns: ViewerColumn[];
  record?: RecordData;
  disabled: boolean;
  error?: Error | null;
  fieldErrors?: Record<string, string>;
  onFieldEdit?: (key: string) => void;
}) {
  const fields = columns.filter((column) => !SYSTEM_FORMATS.includes(column.format));

  return (
    <SheetPanel>
      <div className="flex flex-col gap-4">
        {error && (
          <Alert variant="error">
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}
        {fields.map((column) => {
          const label = (
            <FieldLabel>
              <NamedIcon
                name={column.icon}
                fallback={column.formatIcon}
                className="size-3.5 text-muted-foreground"
              />
              {column.name}
              {column.required && !column.readOnly && (
                <span className="text-destructive-foreground">*</span>
              )}
            </FieldLabel>
          );

          if (column.readOnly)
            return (
              <Field key={column.key} name={column.key}>
                {label}
                <div className="flex min-h-9 items-center text-sm sm:min-h-8">
                  <StaticValue column={column} value={record?.[column.key]} />
                </div>
              </Field>
            );

          return (
            <form.Field key={column.key} name={column.key}>
              {(field) => {
                const messages = [
                  ...(fieldErrors?.[column.key] ? [fieldErrors[column.key]] : []),
                  ...field.state.meta.errors.map((item) => String(item)),
                ];
                const invalid = messages.length > 0;
                return (
                  <Field name={field.name} invalid={invalid}>
                    {label}
                    <RecordInput
                      id={`record-${field.name}`}
                      workspace={workspace}
                      tableId={tableId}
                      column={column}
                      value={field.state.value as FormValue}
                      current={record?.[column.key]}
                      disabled={disabled}
                      onChange={(value) => {
                        field.handleChange(value);
                        onFieldEdit?.(column.key);
                      }}
                      onBlur={field.handleBlur}
                    />
                    {column.description && (
                      <FieldDescription>{column.description}</FieldDescription>
                    )}
                    <FieldError match={invalid}>{messages.join(", ")}</FieldError>
                  </Field>
                );
              }}
            </form.Field>
          );
        })}
        {record && <Activity record={record} />}
      </div>
    </SheetPanel>
  );
}

export function RecordForm({
  form,
  workspace,
  tableId,
  tableName,
  columns,
  record,
  recordId,
  disabled = false,
  status,
  error,
  fieldErrors,
  onFieldEdit,
  children,
}: {
  form: RecordFormApi;
  workspace: string;
  tableId: number;
  tableName: string;
  columns: ViewerColumn[];
  record?: Record<string, unknown>;
  recordId?: string;
  disabled?: boolean;
  status?: string;
  error?: Error | null;
  fieldErrors?: Record<string, string>;
  onFieldEdit?: (key: string) => void;
  children?: React.ReactNode;
}) {
  const title = columns.find((column) => column.title);

  return (
    <Form
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <SheetHeader>
        <SheetTitle className="truncate pe-8">
          {record ? (title && textOf(record[title.key])) || `Record ${recordId}` : "New record"}
        </SheetTitle>
        <SheetDescription>
          {tableName}
          {recordId && (
            <>
              {" · "}
              <span className="font-mono">#{recordId}</span>
            </>
          )}
          {status && ` · ${status}`}
        </SheetDescription>
      </SheetHeader>
      <RecordFields
        form={form}
        workspace={workspace}
        tableId={tableId}
        columns={columns}
        record={record}
        disabled={disabled}
        error={error}
        fieldErrors={fieldErrors}
        onFieldEdit={onFieldEdit}
      />
      {children}
    </Form>
  );
}
