import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { z } from "zod";

import { SettingsRow } from "@/components/shared/settings-row";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { toastManager } from "@/components/ui/toast";
import { adminKeys } from "@/data/admin/keys";
import { updateUserMutationOptions } from "@/data/admin/update-user";
import { workspaceKeys } from "@/data/workspace/keys";
import { DEFAULT_ROLE } from "@/lib/auth/access";
import { getInitials } from "@/lib/initials";

import { RoleSelect, type MemberRole } from "./role-select";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.email("Enter a valid email address"),
  emailVerified: z.boolean(),
  role: z.enum(["admin", "user"]),
});

type MemberProfileFormProps = {
  member: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image?: string | null;
    role?: string | null;
  };
  /** Admins can't change their own role here, so the instance always keeps an admin. */
  isSelf: boolean;
};

export function MemberProfileForm({ member, isSelf }: MemberProfileFormProps) {
  const queryClient = useQueryClient();
  const initial = {
    name: member.name,
    email: member.email,
    emailVerified: member.emailVerified,
    role: (member.role ?? DEFAULT_ROLE) as MemberRole,
  };

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: workspaceKeys.members() }),
      queryClient.invalidateQueries({ queryKey: adminKeys.user(member.id) }),
    ]);

  const updateUser = useMutation({
    ...updateUserMutationOptions,
    onSuccess: async () => {
      await refresh();
      toastManager.add({ type: "success", title: "Member updated" });
    },
  });
  const form = useForm({
    defaultValues: initial,
    validators: { onSubmit: schema },
    onSubmit: async ({ value }) => {
      const data: Record<string, unknown> = {};
      if (value.name.trim() !== initial.name) data.name = value.name.trim();
      if (value.email !== initial.email) data.email = value.email;
      if (value.emailVerified !== initial.emailVerified) data.emailVerified = value.emailVerified;
      if (value.role !== initial.role) data.role = value.role;
      if (Object.keys(data).length === 0) return;

      try {
        await updateUser.mutateAsync({ userId: member.id, data });
        form.reset({ ...value, name: value.name.trim() });
      } catch {
        // Surfaced from the mutation state below.
      }
    },
  });

  return (
    <CardFrame>
      <CardFrameHeader>
        <CardFrameTitle>Profile</CardFrameTitle>
        <CardFrameDescription>
          Name, email and access level. Changes apply immediately.
        </CardFrameDescription>
      </CardFrameHeader>
      <Card>
        <SettingsRow title="Photo" description="Set by the member from their own account.">
          <Avatar className="size-10">
            {member.image && <AvatarImage src={member.image} alt="" />}
            <AvatarFallback>{getInitials(member.name) || "U"}</AvatarFallback>
          </Avatar>
        </SettingsRow>
        <Form
          id="member-profile-form"
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
                title="Full name"
                description="How they appear to others."
              >
                <Input
                  type="text"
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
                title="Email address"
                description="Changing it takes effect without a confirmation email."
              >
                <Input
                  type="email"
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
          <form.Field name="emailVerified">
            {(field) => (
              <SettingsRow
                title="Email verified"
                description="Unverified accounts must confirm their email before signing in."
              >
                <div className="md:self-end">
                  <Switch
                    aria-label="Email verified"
                    checked={field.state.value}
                    onCheckedChange={field.handleChange}
                  />
                </div>
              </SettingsRow>
            )}
          </form.Field>
          <form.Field name="role">
            {(field) => (
              <SettingsRow
                title="Access level"
                description={
                  isSelf
                    ? "You can't change your own role."
                    : "Admins can manage every member and the workspace."
                }
              >
                <RoleSelect
                  value={field.state.value}
                  disabled={isSelf}
                  onValueChange={field.handleChange}
                />
              </SettingsRow>
            )}
          </form.Field>
        </Form>
      </Card>
      {updateUser.error && (
        <div className="px-6 pt-4">
          <Alert variant="error">
            <AlertDescription>{updateUser.error.message}</AlertDescription>
          </Alert>
        </div>
      )}
      <CardFrameFooter className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => form.reset()}>
          Cancel
        </Button>
        <Button type="submit" form="member-profile-form" loading={updateUser.isPending}>
          Save changes
        </Button>
      </CardFrameFooter>
    </CardFrame>
  );
}
