import { useState } from "react";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

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
import { Field, FieldLabel } from "@/components/ui/field";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toastManager } from "@/components/ui/toast";
import { adminKeys } from "@/data/admin/keys";
import { removeUserMutationOptions } from "@/data/admin/remove-user";
import { workspaceKeys } from "@/data/workspace/keys";
import { DEFAULT_WORKSPACE } from "@/lib/workspace";

type DeleteMemberDialogProps = { userId: string; name: string; email: string };

export function DeleteMemberDialog({ userId, name, email }: DeleteMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const removeUser = useMutation({
    ...removeUserMutationOptions,
    onSuccess: async () => {
      await navigate({
        to: "/workspaces/$workspace/settings/members",
        params: { workspace: DEFAULT_WORKSPACE },
      });
      queryClient.removeQueries({ queryKey: adminKeys.user(userId) });
      queryClient.removeQueries({ queryKey: adminKeys.sessions(userId) });
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.members() });
      toastManager.add({ type: "success", title: `${name} was deleted` });
    },
  });

  const form = useForm({
    defaultValues: { confirmation: "" },
    onSubmit: () => removeUser.mutate({ userId }),
  });

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          form.reset();
          removeUser.reset();
        }
      }}
    >
      <AlertDialogTrigger render={<Button variant="destructive-outline" className="w-fit" />}>
        Delete member
      </AlertDialogTrigger>
      <AlertDialogPopup>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes their account, sessions and photo. This can't be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Form
          id="delete-member-form"
          className="flex flex-col gap-4 px-6 pb-2"
          onSubmit={(event) => {
            event.preventDefault();
            form.handleSubmit();
          }}
        >
          <form.Field name="confirmation">
            {(field) => (
              <Field name={field.name}>
                <FieldLabel>
                  Type <span className="font-mono">{email}</span> to confirm
                </FieldLabel>
                <Input
                  type="text"
                  autoComplete="off"
                  value={field.state.value}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
              </Field>
            )}
          </form.Field>
          {removeUser.error && (
            <Alert variant="error">
              <AlertDescription>{removeUser.error.message}</AlertDescription>
            </Alert>
          )}
        </Form>
        <AlertDialogFooter>
          <AlertDialogClose render={<Button variant="ghost" />}>Cancel</AlertDialogClose>
          <form.Subscribe selector={(state) => state.values.confirmation}>
            {(confirmation) => (
              <Button
                type="submit"
                form="delete-member-form"
                variant="destructive"
                disabled={confirmation.trim().toLowerCase() !== email.toLowerCase()}
                loading={removeUser.isPending}
              >
                Delete member
              </Button>
            )}
          </form.Subscribe>
        </AlertDialogFooter>
      </AlertDialogPopup>
    </AlertDialog>
  );
}
