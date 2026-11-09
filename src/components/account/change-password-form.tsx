import { useForm } from "@tanstack/react-form";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";

import { z } from "zod";

import { SettingsRow } from "@/components/shared/settings-row";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardFrame,
  CardFrameDescription,
  CardFrameFooter,
  CardFrameHeader,
  CardFrameTitle,
} from "@/components/ui/card";
import { FieldError } from "@/components/ui/field";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { accountsQueryOptions } from "@/data/auth/accounts";
import { changePasswordMutationOptions } from "@/data/auth/change-password";

const schema = z.object({
  currentPassword: z.string().min(1, "Enter your current password"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  revokeOtherSessions: z.boolean(),
});

export function ChangePasswordForm() {
  const { data: accounts } = useSuspenseQuery(accountsQueryOptions);
  const hasPassword = accounts.some((account) => account.providerId === "credential");

  const mutation = useMutation({
    ...changePasswordMutationOptions,
    onSuccess: () => form.reset(),
  });

  const form = useForm({
    defaultValues: { currentPassword: "", newPassword: "", revokeOtherSessions: true },
    validators: { onSubmit: schema },
    onSubmit: ({ value }) => mutation.mutate(value),
  });

  return (
    <CardFrame>
      <CardFrameHeader>
        <CardFrameTitle>Password</CardFrameTitle>
        <CardFrameDescription>Change the password you use to sign in.</CardFrameDescription>
      </CardFrameHeader>
      {hasPassword ? (
        <>
          <Card>
            <Form
              id="password-form"
              onSubmit={(event) => {
                event.preventDefault();
                form.handleSubmit();
              }}
            >
              <form.Field name="currentPassword">
                {(field) => (
                  <SettingsRow
                    field={{
                      name: field.name,
                      invalid: field.state.meta.isTouched && !field.state.meta.isValid,
                    }}
                    title="Current Password"
                    description="Confirm it's you before changing."
                  >
                    <Input
                      type="password"
                      autoComplete="current-password"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                    />
                    <FieldError match={field.state.meta.isTouched && !field.state.meta.isValid}>
                      {field.state.meta.errors.map((error) => error?.message).join(", ")}
                    </FieldError>
                  </SettingsRow>
                )}
              </form.Field>
              <form.Field name="newPassword">
                {(field) => (
                  <SettingsRow
                    field={{
                      name: field.name,
                      invalid: field.state.meta.isTouched && !field.state.meta.isValid,
                    }}
                    title="New Password"
                    description="At least 8 characters."
                  >
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
                  </SettingsRow>
                )}
              </form.Field>
              <form.Field name="revokeOtherSessions">
                {(field) => (
                  <SettingsRow
                    title="Sign Out Other Devices"
                    description="End every other session when the password changes."
                  >
                    <div className="md:self-end">
                      <Switch
                        aria-label="Sign out other devices"
                        checked={field.state.value}
                        onCheckedChange={field.handleChange}
                      />
                    </div>
                  </SettingsRow>
                )}
              </form.Field>
            </Form>
          </Card>
          {(mutation.error || mutation.isSuccess) && (
            <div className="px-6 pt-4">
              {mutation.error ? (
                <Alert variant="error">
                  <AlertDescription>{mutation.error.message}</AlertDescription>
                </Alert>
              ) : (
                <Alert variant="success">
                  <AlertDescription>Your password was updated.</AlertDescription>
                </Alert>
              )}
            </div>
          )}
          <CardFrameFooter className="flex justify-end">
            <Button type="submit" form="password-form" loading={mutation.isPending}>
              Update password
            </Button>
          </CardFrameFooter>
        </>
      ) : (
        <Card>
          <SettingsRow
            title="No password set"
            description="You sign in with a linked provider, so there's no password to change."
          />
        </Card>
      )}
    </CardFrame>
  );
}
