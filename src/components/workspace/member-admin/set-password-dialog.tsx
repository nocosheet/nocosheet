import { useState } from "react";

import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";

import { z } from "zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toastManager } from "@/components/ui/toast";
import { revokeUserSessionsMutationOptions } from "@/data/admin/revoke-user-sessions";
import { setUserPasswordMutationOptions } from "@/data/admin/set-user-password";

const schema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  signOutEverywhere: z.boolean(),
});

export function SetPasswordDialog({ userId, name }: { userId: string; name: string }) {
  const [open, setOpen] = useState(false);
  const setPassword = useMutation(setUserPasswordMutationOptions);
  const revokeSessions = useMutation(revokeUserSessionsMutationOptions);

  const form = useForm({
    defaultValues: { password: "", signOutEverywhere: true },
    validators: { onSubmit: schema },
    onSubmit: async ({ value }) => {
      try {
        await setPassword.mutateAsync({ userId, newPassword: value.password });
        if (value.signOutEverywhere) await revokeSessions.mutateAsync({ userId });
        toastManager.add({ type: "success", title: "Password updated" });
        setOpen(false);
      } catch {
        // Surfaced from the mutation state below.
      }
    },
  });

  const error = setPassword.error ?? revokeSessions.error;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          form.reset();
          setPassword.reset();
          revokeSessions.reset();
        }
      }}
    >
      <DialogTrigger render={<Button variant="outline" className="w-fit" />}>
        Set password
      </DialogTrigger>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Set a new password</DialogTitle>
          <DialogDescription>
            Choose a password for {name}. Share it securely and ask them to change it after signing
            in.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <Form
            id="set-member-password-form"
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
                    autoFocus
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
            <form.Field name="signOutEverywhere">
              {(field) => (
                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-col gap-0.5">
                    <p className="font-medium text-sm">Sign out all devices</p>
                    <p className="text-muted-foreground text-sm">
                      End their current sessions so the old password stops working everywhere.
                    </p>
                  </div>
                  <Switch
                    aria-label="Sign out all devices"
                    checked={field.state.value}
                    onCheckedChange={field.handleChange}
                  />
                </div>
              )}
            </form.Field>
            {error && (
              <Alert variant="error">
                <AlertDescription>{error.message}</AlertDescription>
              </Alert>
            )}
          </Form>
        </DialogPanel>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
          <Button
            type="submit"
            form="set-member-password-form"
            loading={setPassword.isPending || revokeSessions.isPending}
          >
            Set password
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
