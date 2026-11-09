import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";

import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { verifyBackupCodeMutationOptions } from "@/data/auth/verify-backup-code";
import { useCompleteSignIn } from "@/hooks/use-complete-sign-in";

import { AuthErrorAlert } from "./auth-error-alert";

const schema = z.object({
  code: z.string().min(1, "Enter a backup code"),
  trustDevice: z.boolean(),
});

export function TwoFactorBackupForm() {
  const completeSignIn = useCompleteSignIn();
  const mutation = useMutation({ ...verifyBackupCodeMutationOptions, onSuccess: completeSignIn });

  const form = useForm({
    defaultValues: { code: "", trustDevice: false },
    validators: { onSubmit: schema },
    onSubmit: ({ value }) => mutation.mutate({ ...value, code: value.code.trim() }),
  });

  return (
    <Form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        form.handleSubmit();
      }}
    >
      <form.Field name="code">
        {(field) => (
          <Field
            name={field.name}
            invalid={field.state.meta.isTouched && !field.state.meta.isValid}
          >
            <FieldLabel>Backup code</FieldLabel>
            <Input
              type="text"
              autoComplete="one-time-code"
              autoFocus
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
            />
            <FieldError match={field.state.meta.isTouched && !field.state.meta.isValid}>
              {field.state.meta.errors.map((error) => error?.message).join(", ")}
            </FieldError>
          </Field>
        )}
      </form.Field>
      <form.Field name="trustDevice">
        {(field) => (
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={field.state.value} onCheckedChange={field.handleChange} />
            Trust this device for 30 days
          </label>
        )}
      </form.Field>
      <AuthErrorAlert error={mutation.error} />
      <Button type="submit" className="w-full" loading={mutation.isPending}>
        Verify
      </Button>
    </Form>
  );
}
