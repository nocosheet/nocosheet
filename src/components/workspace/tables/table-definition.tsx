import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";

import { z } from "zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardFrame,
  CardFrameDescription,
  CardFrameFooter,
  CardFrameHeader,
  CardFrameTitle,
  CardPanel,
} from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toastManager } from "@/components/ui/toast";
import { workspaceKeys } from "@/data/workspace/keys";
import { tableQueryOptions, updateTableMutationOptions } from "@/data/workspace/tables";
import { formSchema } from "@/lib/tables/form";
import { TITLE_FORMATS } from "@/lib/tables/formats";
import { toTableName } from "@/lib/tables/naming";
import { tableInputSchema } from "@/lib/tables/validation";

import { ColumnsEditor } from "./columns-editor";
import { IconPicker } from "./icon-picker";
import { TitleSelect } from "./title-select";

type DefinitionValues = {
  name: string;
  icon: string;
  groupName: string;
  description: string;
  titleColumn: string | null;
};

const schema = z.object({ name: tableInputSchema.shape.name });

export function TableDefinition({ workspace, tableId }: { workspace: string; tableId: number }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: table } = useSuspenseQuery(tableQueryOptions(workspace, tableId));

  const titleOptions = table.columns
    .filter((column) => TITLE_FORMATS.includes(column.format as never))
    .map((column) => ({ value: column.columnName, label: column.name }));
  const savedTitle =
    table.columns.find((column) => column.id === table.titleColumnId)?.columnName ?? null;

  const updateTable = useMutation({
    ...updateTableMutationOptions,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.tables() });
      await router.invalidate();
      toastManager.add({ type: "success", title: "Table saved" });
    },
  });

  const form = useForm({
    defaultValues: {
      name: table.name,
      icon: table.icon ?? "table",
      groupName: table.groupName ?? "",
      description: table.description ?? "",
      titleColumn: savedTitle,
    } as DefinitionValues,
    validators: { onSubmit: formSchema<DefinitionValues>(schema) },
    onSubmit: ({ value }) =>
      updateTable.mutate({
        workspace,
        id: tableId,
        values: {
          name: value.name,
          icon: value.icon,
          groupName: value.groupName,
          description: value.description,
          titleColumn: value.titleColumn,
        },
      }),
  });

  return (
    <div className="flex flex-col gap-6">
      <CardFrame>
        <CardFrameHeader>
          <CardFrameTitle>{table.name}</CardFrameTitle>
          <CardFrameDescription>Edit the table and manage its columns.</CardFrameDescription>
        </CardFrameHeader>
        <Card>
          <CardPanel>
            <Form
              id="table-definition-form"
              className="flex flex-col gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                void form.handleSubmit();
              }}
            >
              <div className="flex items-start gap-3">
                <form.Field name="icon">
                  {(field) => (
                    <Field name={field.name} className="w-auto">
                      <FieldLabel>Icon</FieldLabel>
                      <IconPicker
                        label="Table icon"
                        value={field.state.value}
                        onChange={field.handleChange}
                      />
                    </Field>
                  )}
                </form.Field>
                <form.Field name="name">
                  {(field) => (
                    <Field
                      name={field.name}
                      className="flex-1"
                      invalid={field.state.meta.isTouched && !field.state.meta.isValid}
                    >
                      <FieldLabel>Name</FieldLabel>
                      <Input
                        autoComplete="off"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) => field.handleChange(event.target.value)}
                      />
                      <FieldDescription>
                        Stored as <code>{table.tableName}</code>
                        {toTableName(field.state.value) !== table.tableName &&
                          ". Renaming only changes the display name."}
                      </FieldDescription>
                      <FieldError match={field.state.meta.isTouched && !field.state.meta.isValid}>
                        {field.state.meta.errors.map((item) => item?.message).join(", ")}
                      </FieldError>
                    </Field>
                  )}
                </form.Field>
              </div>

              <form.Field name="groupName">
                {(field) => (
                  <Field name={field.name}>
                    <FieldLabel>Group</FieldLabel>
                    <Input
                      autoComplete="off"
                      placeholder="Optional, e.g. Sales"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                    />
                    <FieldDescription>
                      Tables in the same group are listed together in the sidebar.
                    </FieldDescription>
                  </Field>
                )}
              </form.Field>

              <form.Field name="description">
                {(field) => (
                  <Field name={field.name}>
                    <FieldLabel>Description</FieldLabel>
                    <Textarea
                      placeholder="Optional"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                    />
                  </Field>
                )}
              </form.Field>

              <form.Field name="titleColumn">
                {(field) => (
                  <TitleSelect
                    options={titleOptions}
                    value={
                      titleOptions.some((option) => option.value === field.state.value)
                        ? field.state.value
                        : null
                    }
                    onValueChange={field.handleChange}
                  />
                )}
              </form.Field>

              {updateTable.error && (
                <Alert variant="error">
                  <AlertDescription>{updateTable.error.message}</AlertDescription>
                </Alert>
              )}
            </Form>
          </CardPanel>
        </Card>
        <CardFrameFooter className="flex justify-end">
          <Button type="submit" form="table-definition-form" loading={updateTable.isPending}>
            Save changes
          </Button>
        </CardFrameFooter>
      </CardFrame>

      <CardFrame>
        <CardFrameHeader>
          <CardFrameTitle>Columns</CardFrameTitle>
          <CardFrameDescription>
            Changes are saved as you make them. A column's type can't change after it is created.
          </CardFrameDescription>
        </CardFrameHeader>
        <Card>
          <CardPanel>
            <ColumnsEditor workspace={workspace} tableId={tableId} />
          </CardPanel>
        </Card>
      </CardFrame>
    </div>
  );
}
