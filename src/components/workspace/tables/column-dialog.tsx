import { useMemo, useState } from "react";

import { useForm } from "@tanstack/react-form";

import { ChevronDownIcon } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formSchema } from "@/lib/tables/form";
import { FORMATS, SEARCHABLE_FORMATS, type SelectChoice } from "@/lib/tables/formats";
import { columnDraftSchema, defaultOptions } from "@/lib/tables/validation";

import { newColumnDraft, type ColumnDraft } from "./column-draft";
import { ColumnOptions } from "./column-options";
import { FormatSelect } from "./format-select";
import { IconPicker } from "./icon-picker";

const FLAGS = [
  { name: "isRequired", label: "Required" },
  { name: "isUnique", label: "Unique" },
  { name: "isFilterable", label: "Filterable" },
  { name: "isSortable", label: "Sortable" },
  { name: "isSearchable", label: "Searchable" },
  { name: "isHidden", label: "Hidden" },
] as const;

const BOOLEAN_DEFAULTS = [
  { value: "none", label: "No default" },
  { value: "true", label: "Checked" },
  { value: "false", label: "Unchecked" },
];

export function ColumnDialog({
  open,
  onOpenChange,
  formKey,
  initial,
  taken,
  onSave,
}: {
  formKey: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: ColumnDraft | null;
  taken: string[];
  onSave: (column: ColumnDraft) => Promise<unknown>;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit column" : "Add a column"}</DialogTitle>
          <DialogDescription>
            {initial
              ? "Rename the column or change how it is indexed. Its type can't change."
              : "Choose how this column stores and validates its values."}
          </DialogDescription>
        </DialogHeader>
        <ColumnForm
          key={formKey}
          initial={initial ?? newColumnDraft()}
          locked={initial !== null}
          taken={taken}
          onSave={async (column) => {
            await onSave(column);
            onOpenChange(false);
          }}
        />
      </DialogPopup>
    </Dialog>
  );
}

function ColumnForm({
  initial,
  locked,
  taken,
  onSave,
}: {
  initial: ColumnDraft;
  locked: boolean;
  taken: string[];
  onSave: (column: ColumnDraft) => Promise<unknown>;
}) {
  const [error, setError] = useState<string | null>(null);

  const schema = useMemo(
    () =>
      columnDraftSchema.superRefine((column, ctx) => {
        if (taken.includes(column.name.trim().toLowerCase()))
          ctx.addIssue({
            code: "custom",
            path: ["name"],
            message: "A column with this name already exists",
          });
      }),
    [taken],
  );

  const form = useForm({
    defaultValues: initial,
    validators: { onSubmit: formSchema<ColumnDraft>(schema) },
    onSubmit: async ({ value }) => {
      setError(null);
      try {
        await onSave({ ...value, name: value.name.trim() });
      } catch (failure) {
        setError(failure instanceof Error ? failure.message : "Something went wrong");
      }
    },
  });

  return (
    <>
      <DialogPanel>
        <Form
          id="column-form"
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <div className="flex items-start gap-3">
            <form.Field name="icon">
              {(field) => (
                <Field name={field.name} className="w-auto">
                  <FieldLabel>Icon</FieldLabel>
                  <IconPicker
                    label="Column icon"
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
                    placeholder="Email address"
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

          <form.Field name="description">
            {(field) => (
              <Field name={field.name}>
                <FieldLabel>Description</FieldLabel>
                <Textarea
                  placeholder="Optional"
                  value={field.state.value}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
              </Field>
            )}
          </form.Field>

          <form.Field name="format">
            {(field) => (
              <Field name={field.name}>
                <FieldLabel>Type</FieldLabel>
                <FormatSelect
                  disabled={locked}
                  value={field.state.value}
                  onValueChange={(format) => {
                    field.handleChange(format);
                    form.setFieldValue("options", defaultOptions(format));
                    form.setFieldValue("defaultValue", "");
                    if (!SEARCHABLE_FORMATS.includes(format))
                      form.setFieldValue("isSearchable", false);
                  }}
                />
                <FieldDescription>
                  Stored as {FORMATS[field.state.value].type ?? "the linked table's id type"}.
                </FieldDescription>
              </Field>
            )}
          </form.Field>

          {!locked && (
            <div className="flex flex-wrap items-start gap-4 empty:hidden">
              <form.Subscribe selector={(state) => state.values.format}>
                {(format) => (
                  <form.Field name="options">
                    {(field) => (
                      <>
                        <ColumnOptions
                          format={format}
                          options={field.state.value}
                          onChange={field.handleChange}
                        />
                        {field.state.meta.errors.length > 0 && (
                          <Field name={field.name} invalid className="basis-full">
                            <FieldError match>
                              {field.state.meta.errors.map((item) => item?.message).join(", ")}
                            </FieldError>
                          </Field>
                        )}
                      </>
                    )}
                  </form.Field>
                )}
              </form.Subscribe>

              <form.Subscribe
                selector={(state) => ({
                  format: state.values.format,
                  options: state.values.options,
                  computed: state.values.generatedExpression.trim().length > 0,
                })}
              >
                {({ format, options, computed }) => {
                  const kind = FORMATS[format].defaultKind;
                  if (!kind || computed) return null;
                  return (
                    <form.Field name="defaultValue">
                      {(field) => (
                        <Field name={field.name} className="min-w-40 flex-1">
                          <FieldLabel>Default value</FieldLabel>
                          {kind === "text" ? (
                            <Input
                              autoComplete="off"
                              placeholder="Optional"
                              value={field.state.value}
                              onChange={(event) => field.handleChange(event.target.value)}
                            />
                          ) : (
                            <DefaultSelect
                              items={
                                kind === "boolean"
                                  ? BOOLEAN_DEFAULTS
                                  : [
                                      { value: "none", label: "No default" },
                                      ...((options.choices as SelectChoice[] | undefined) ?? [])
                                        .filter((choice) => choice.value)
                                        .map((choice) => ({
                                          value: choice.value,
                                          label: choice.label,
                                        })),
                                    ]
                              }
                              value={field.state.value || "none"}
                              onValueChange={(value) =>
                                field.handleChange(value === "none" ? "" : value)
                              }
                            />
                          )}
                          <FieldError match={field.state.meta.errors.length > 0}>
                            {field.state.meta.errors.map((item) => item?.message).join(", ")}
                          </FieldError>
                        </Field>
                      )}
                    </form.Field>
                  );
                }}
              </form.Subscribe>
            </div>
          )}

          <form.Subscribe selector={(state) => state.values.format}>
            {(format) => (
              <div className="flex flex-wrap gap-x-6 gap-y-3">
                {FLAGS.filter(
                  (flag) => flag.name !== "isSearchable" || SEARCHABLE_FORMATS.includes(format),
                ).map((flag) => (
                  <form.Field key={flag.name} name={flag.name}>
                    {(field) => (
                      <Label>
                        <Checkbox
                          checked={field.state.value}
                          onCheckedChange={(checked) => field.handleChange(checked === true)}
                        />
                        {flag.label}
                      </Label>
                    )}
                  </form.Field>
                ))}
              </div>
            )}
          </form.Subscribe>

          {!locked && (
            <Collapsible>
              <CollapsibleTrigger
                render={<Button type="button" variant="ghost" size="sm" className="-ms-2" />}
              >
                <ChevronDownIcon />
                Advanced
              </CollapsibleTrigger>
              <CollapsiblePanel>
                <div className="flex flex-col gap-4 pt-3">
                  <form.Field name="checkExpression">
                    {(field) => (
                      <Field name={field.name}>
                        <FieldLabel>Check expression</FieldLabel>
                        <Input
                          autoComplete="off"
                          className="font-mono"
                          placeholder="{Price} >= 0"
                          value={field.state.value}
                          onChange={(event) => field.handleChange(event.target.value)}
                        />
                        <FieldDescription>
                          A SQL condition every value must satisfy. Refer to columns as {"{Column name}"}.
                        </FieldDescription>
                        <FieldError match={field.state.meta.errors.length > 0}>
                          {field.state.meta.errors.map((item) => item?.message).join(", ")}
                        </FieldError>
                      </Field>
                    )}
                  </form.Field>
                  <form.Field name="generatedExpression">
                    {(field) => (
                      <Field name={field.name}>
                        <FieldLabel>Computed value</FieldLabel>
                        <Input
                          autoComplete="off"
                          className="font-mono"
                          placeholder="{Price} * {Quantity}"
                          value={field.state.value}
                          onChange={(event) => field.handleChange(event.target.value)}
                        />
                        <FieldDescription>
                          Makes this a virtual column calculated from other columns, written as {"{Column name}"}. It can't be edited.
                        </FieldDescription>
                        <FieldError match={field.state.meta.errors.length > 0}>
                          {field.state.meta.errors.map((item) => item?.message).join(", ")}
                        </FieldError>
                      </Field>
                    )}
                  </form.Field>
                </div>
              </CollapsiblePanel>
            </Collapsible>
          )}
        </Form>
        {error && (
          <Alert variant="error" className="mt-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </DialogPanel>
      <DialogFooter>
        <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(submitting) => (
            <Button type="submit" form="column-form" loading={submitting}>
              Save column
            </Button>
          )}
        </form.Subscribe>
      </DialogFooter>
    </>
  );
}

function DefaultSelect({
  items,
  value,
  onValueChange,
}: {
  items: { value: string; label: string }[];
  value: string;
  onValueChange: (value: string) => void;
}) {
  return (
    <Select
      value={value}
      items={items}
      onValueChange={(next) => next !== null && onValueChange(String(next))}
    >
      <SelectTrigger aria-label="Default value" className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectPopup>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectPopup>
    </Select>
  );
}
