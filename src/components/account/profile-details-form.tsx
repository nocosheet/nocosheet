import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";

import { z } from "zod";

import { SettingsRow } from "@/components/shared/settings-row";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
import { changeEmailMutationOptions } from "@/data/auth/change-email";
import { useRefreshSession } from "@/data/auth/session-refresh";
import { updateUserMutationOptions } from "@/data/auth/update-user";

import { ProfilePhoto } from "./profile-photo";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Enter a valid email address"),
});

type ProfileDetailsFormProps = {
  user: { name: string; email: string; emailVerified: boolean; image?: string | null };
};

export function ProfileDetailsForm({ user }: ProfileDetailsFormProps) {
  const refreshSession = useRefreshSession();
  const updateUser = useMutation(updateUserMutationOptions);
  const changeEmail = useMutation(changeEmailMutationOptions);

  const form = useForm({
    defaultValues: { name: user.name, email: user.email },
    validators: { onSubmit: schema },
    onSubmit: async ({ value }) => {
      try {
        if (value.name !== user.name) await updateUser.mutateAsync({ name: value.name });
        if (value.email !== user.email) await changeEmail.mutateAsync({ newEmail: value.email });
        await refreshSession();
        // The address only changes once the new one is verified, so keep showing the current one.
        form.reset({ name: value.name, email: user.email });
      } catch {
        // Errors are surfaced from the mutation state below.
      }
    },
  });

  const error = updateUser.error ?? changeEmail.error;

  return (
    <CardFrame>
      <CardFrameHeader>
        <CardFrameTitle>Profile Details</CardFrameTitle>
        <CardFrameDescription>Personal account info.</CardFrameDescription>
      </CardFrameHeader>
      <Card>
        <ProfilePhoto user={user} />
        <Form
          id="profile-form"
          onSubmit={(event) => {
            event.preventDefault();
            form.handleSubmit();
          }}
        >
          <form.Field name="name">
            {(field) => (
              <SettingsRow
                field={{
                  name: field.name,
                  invalid: field.state.meta.isTouched && !field.state.meta.isValid,
                }}
                title="Full Name"
                description="Shown on your account and in messages."
              >
                <Input
                  type="text"
                  autoComplete="name"
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
          <form.Field name="email">
            {(field) => (
              <SettingsRow
                field={{
                  name: field.name,
                  invalid: field.state.meta.isTouched && !field.state.meta.isValid,
                }}
                title="Email Address"
                description="Primary sign-in email."
                badge={
                  <Badge variant={user.emailVerified ? "success" : "warning"} size="sm">
                    {user.emailVerified ? "Verified" : "Unverified"}
                  </Badge>
                }
              >
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
              </SettingsRow>
            )}
          </form.Field>
        </Form>
      </Card>
      {(error || changeEmail.isSuccess) && (
        <div className="px-6 pt-4">
          {error ? (
            <Alert variant="error">
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          ) : (
            <Alert variant="info">
              <AlertDescription>
                We sent an approval link to your current email. After you approve it, we'll ask you
                to verify the new address.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
      <CardFrameFooter className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => form.reset()}>
          Cancel
        </Button>
        <Button
          type="submit"
          form="profile-form"
          loading={updateUser.isPending || changeEmail.isPending}
        >
          Save changes
        </Button>
      </CardFrameFooter>
    </CardFrame>
  );
}
