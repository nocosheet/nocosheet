import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { resetPasswordMutationOptions } from "@/data/auth/reset-password";

import { AuthErrorAlert } from "./auth-error-alert";

const schema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export function ResetPasswordForm({ token }: { token: string }) {
  const navigate = useNavigate();

  const mutation = useMutation({
    ...resetPasswordMutationOptions,
    onSuccess: () => navigate({ to: "/auth/sign-in" }),
  });

  const form = useForm({
    defaultValues: { password: "", confirmPassword: "" },
    validators: { onSubmit: schema },
    onSubmit: ({ value }) => mutation.mutate({ token, newPassword: value.password }),
  });

  return (
    <Form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        form.handleSubmit();
      }}
    >
      <form.Field name="password">
        {(field) => (
          <Field
            name={field.name}
            invalid={field.state.meta.isTouched && !field.state.meta.isValid}
          >
            <FieldLabel>New password</FieldLabel>
            <Input
              type="password"
              autoComplete="new-password"
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
      <form.Field name="confirmPassword">
        {(field) => (
          <Field
            name={field.name}
            invalid={field.state.meta.isTouched && !field.state.meta.isValid}
          >
            <FieldLabel>Confirm password</FieldLabel>
            <Input
              type="password"
              autoComplete="new-password"
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
        Reset password
      </Button>
    </Form>
  );
}
