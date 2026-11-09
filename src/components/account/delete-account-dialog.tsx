import { useState } from "react";

import { useForm } from "@tanstack/react-form";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { z } from "zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { accountsQueryOptions } from "@/data/auth/accounts";
import { deleteUserMutationOptions } from "@/data/auth/delete-user";
import { useRefreshSession } from "@/data/auth/session-refresh";

export function DeleteAccountDialog() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const refreshSession = useRefreshSession();
  const { data: accounts } = useSuspenseQuery(accountsQueryOptions);
  const hasPassword = accounts.some((account) => account.providerId === "credential");

  const deleteUser = useMutation({
    ...deleteUserMutationOptions,
    onSuccess: async () => {
      await refreshSession({ signedOut: true });
      await navigate({ to: "/auth/sign-in" });
    },
  });

  const form = useForm({
    defaultValues: { password: "" },
    validators: {
      onSubmit: z.object({
        password: hasPassword ? z.string().min(1, "Enter your password to confirm") : z.string(),
      }),
    },
    onSubmit: ({ value }) => deleteUser.mutate(hasPassword ? { password: value.password } : {}),
  });

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          form.reset();
          deleteUser.reset();
        }
      }}
    >
      <AlertDialogTrigger render={<Button variant="destructive-outline" />}>
        Delete account
      </AlertDialogTrigger>
      <AlertDialogPopup>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete your account?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes your account and signs you out everywhere. This can't be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Form
          id="delete-account-form"
          className="flex flex-col gap-4 px-6 pb-2"
          onSubmit={(event) => {
            event.preventDefault();
            form.handleSubmit();
          }}
        >
          {hasPassword && (
            <form.Field name="password">
              {(field) => (
                <Field
                  name={field.name}
                  invalid={field.state.meta.isTouched && !field.state.meta.isValid}
                >
                  <FieldLabel>Password</FieldLabel>
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
                </Field>
              )}
            </form.Field>
          )}
          {deleteUser.error && (
            <Alert variant="error">
              <AlertDescription>{deleteUser.error.message}</AlertDescription>
            </Alert>
          )}
        </Form>
        <AlertDialogFooter>
          <AlertDialogClose render={<Button variant="ghost" />}>Cancel</AlertDialogClose>
          <Button
            type="submit"
            form="delete-account-form"
            variant="destructive"
            loading={deleteUser.isPending}
          >
            Delete account
          </Button>
        </AlertDialogFooter>
      </AlertDialogPopup>
    </AlertDialog>
  );
}
