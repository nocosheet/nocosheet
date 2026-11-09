import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { signUpMutationOptions } from "@/data/auth/sign-up";

import { AuthErrorAlert } from "./auth-error-alert";

const schema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export function SignUpForm() {
  const navigate = useNavigate();

  const mutation = useMutation({
    ...signUpMutationOptions,
    onSuccess: (_data, { email }) => navigate({ to: "/auth/verify-email", search: { email } }),
  });

  const form = useForm({
    defaultValues: { email: "", password: "" },
    validators: { onSubmit: schema },
    onSubmit: ({ value }) =>
      mutation.mutate({
        name: value.email.split("@")[0],
        email: value.email,
        password: value.password,
      }),
  });

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
      <form.Field name="password">
        {(field) => (
          <Field
            name={field.name}
            invalid={field.state.meta.isTouched && !field.state.meta.isValid}
          >
            <FieldLabel>Password</FieldLabel>
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
        Create account
      </Button>
    </Form>
  );
}
