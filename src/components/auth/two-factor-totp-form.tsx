import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";

import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Form } from "@/components/ui/form";
import { OTPField, OTPFieldInput } from "@/components/ui/otp-field";
import { verifyTotpMutationOptions } from "@/data/auth/verify-totp";
import { useCompleteSignIn } from "@/hooks/use-complete-sign-in";

import { AuthErrorAlert } from "./auth-error-alert";

const schema = z.object({
  code: z.string().length(6, "Enter the 6-digit code"),
  trustDevice: z.boolean(),
});

export function TwoFactorTotpForm() {
  const completeSignIn = useCompleteSignIn();
  const mutation = useMutation({ ...verifyTotpMutationOptions, onSuccess: completeSignIn });

  const form = useForm({
    defaultValues: { code: "", trustDevice: false },
    validators: { onSubmit: schema },
    onSubmit: ({ value }) => mutation.mutate(value),
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
            className="items-center"
          >
            <FieldLabel className="sr-only">Authentication code</FieldLabel>
            <OTPField
              length={6}
              value={field.state.value}
              onValueChange={field.handleChange}
              autoFocus
            >
              <OTPFieldInput />
              <OTPFieldInput aria-label="Digit 2 of 6" />
              <OTPFieldInput aria-label="Digit 3 of 6" />
              <OTPFieldInput aria-label="Digit 4 of 6" />
              <OTPFieldInput aria-label="Digit 5 of 6" />
              <OTPFieldInput aria-label="Digit 6 of 6" />
            </OTPField>
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
