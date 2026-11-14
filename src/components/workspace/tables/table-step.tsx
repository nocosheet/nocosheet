import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { ArrowRightIcon } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { workspaceKeys } from "@/data/workspace/keys";
import { createTableMutationOptions } from "@/data/workspace/tables";
import { useWorkspace } from "@/hooks/use-workspace";
import { formSchema } from "@/lib/tables/form";
import { DEFAULT_TABLE_ICON } from "@/lib/tables/icons";
import { tableInputSchema } from "@/lib/tables/validation";

import { IconPicker } from "./icon-picker";
import { WizardFooter, WizardPanel } from "./wizard-panel";

type TableFormValues = {
  name: string;
  icon: string;
  groupName: string;
  description: string;
};

export function TableStep({ onDone }: { onDone: (tableId: number) => void }) {
  const queryClient = useQueryClient();
  const { id: workspace } = useWorkspace();

  const createTable = useMutation({
    ...createTableMutationOptions,
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.tables() });
      onDone(created.id);
    },
  });

  const form = useForm({
    defaultValues: {
      name: "",
      icon: DEFAULT_TABLE_ICON,
      groupName: "",
      description: "",
    } as TableFormValues,
    validators: { onSubmit: formSchema<TableFormValues>(tableInputSchema) },
    onSubmit: ({ value }) => createTable.mutate({ workspace, ...value }),
  });

  return (
    <>
      <WizardPanel
        step={1}
        title="Table"
        description="Name your table and choose how its records are identified."
      >
        <Form
          id="table-step-form"
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
                    autoFocus
                    autoComplete="off"
                    placeholder="Customers"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
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

          {createTable.error && (
            <Alert variant="error">
              <AlertDescription>{createTable.error.message}</AlertDescription>
            </Alert>
          )}
        </Form>
      </WizardPanel>
      <WizardFooter hint="Creates the table with its id and tracking columns.">
        <Button type="submit" form="table-step-form" loading={createTable.isPending}>
          Next
          <ArrowRightIcon />
        </Button>
      </WizardFooter>
    </>
  );
}
