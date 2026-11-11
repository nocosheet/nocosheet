import { useForm } from "@tanstack/react-form";

import type { FormValues } from "@/lib/records/form";

export function useRecordForm({
  initial,
  validate,
  onSubmit,
}: {
  initial: FormValues;
  validate?: (value: FormValues) => Record<string, string>;
  onSubmit?: (value: FormValues) => void;
}) {
  return useForm({
    defaultValues: initial,
    validators: {
      onSubmit: ({ value }) => {
        const errors = validate?.(value) ?? {};
        return Object.keys(errors).length > 0 ? { fields: errors } : undefined;
      },
    },
    onSubmit: ({ value }) => onSubmit?.(value),
  });
}

export type RecordForm = ReturnType<typeof useRecordForm>;
