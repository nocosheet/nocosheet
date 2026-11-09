import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";

import { z } from "zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { forgotPasswordMutationOptions } from "@/data/auth/forgot-password";

import { AuthErrorAlert } from "./auth-error-alert";

const schema = z.object({
  email: z.email("Enter a valid email address"),
});

export function ForgotPasswordForm() {
  const mutation = useMutation(forgotPasswordMutationOptions);

  const form = useForm({
    defaultValues: { email: "" },
    validators: { onSubmit: schema },
    onSubmit: ({ value }) => mutation.mutate(value),
  });

  if (mutation.isSuccess) {
    return (
      <Alert variant="success">
        <AlertDescription>
          If an account exists for {form.state.values.email}, a reset link is on its way.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        form.handleSubmit();
      }}
    >
      <form.Field name="email">
        {(field) => (
          <Field
            name={field.name}
            invalid={field.state.meta.isTouched && !field.state.meta.isValid}
          >
            <FieldLabel>Email</FieldLabel>
            <Input
              type="email"
              autoComplete="email"
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
      <AuthErrorAlert error={mutation.error} />
      <Button type="submit" className="w-full" loading={mutation.isPending}>
        Send reset link
      </Button>
    </Form>
  );
}
