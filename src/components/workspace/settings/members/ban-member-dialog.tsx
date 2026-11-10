import { useState } from "react";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";

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
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toastManager } from "@/components/ui/toast";
import { banUserMutationOptions } from "@/data/admin/ban-user";
import { adminKeys } from "@/data/admin/keys";
import { workspaceKeys } from "@/data/workspace/keys";

const DAY = 60 * 60 * 24;

const durations = [
  { value: "0", label: "Permanently", seconds: undefined },
  { value: "1", label: "1 day", seconds: DAY },
  { value: "7", label: "7 days", seconds: 7 * DAY },
  { value: "30", label: "30 days", seconds: 30 * DAY },
];

export function BanMemberDialog({ userId, name }: { userId: string; name: string }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const banUser = useMutation({
    ...banUserMutationOptions,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminKeys.user(userId) }),
        queryClient.invalidateQueries({ queryKey: adminKeys.sessions(userId) }),
        queryClient.invalidateQueries({ queryKey: workspaceKeys.members() }),
      ]);
      toastManager.add({ type: "success", title: `${name} was banned` });
      setOpen(false);
    },
  });

  const form = useForm({
    defaultValues: { reason: "", duration: "0" },
    onSubmit: ({ value }) =>
      banUser.mutate({
        userId,
        banReason: value.reason.trim() || undefined,
        banExpiresIn: durations.find((item) => item.value === value.duration)?.seconds,
      }),
  });

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          form.reset();
          banUser.reset();
        }
      }}
    >
      <AlertDialogTrigger render={<Button variant="destructive-outline" className="w-fit" />}>
        Ban member
      </AlertDialogTrigger>
      <AlertDialogPopup>
        <AlertDialogHeader>
          <AlertDialogTitle>Ban {name}?</AlertDialogTitle>
          <AlertDialogDescription>
            They are signed out immediately and can't sign in while banned.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Form
          id="ban-member-form"
          className="flex flex-col gap-4 px-6 pb-2"
          onSubmit={(event) => {
            event.preventDefault();
            form.handleSubmit();
          }}
        >
          <form.Field name="duration">
            {(field) => (
              <Field name={field.name}>
                <FieldLabel>Ban length</FieldLabel>
                <Select
                  value={field.state.value}
                  items={durations}
                  onValueChange={(value) => field.handleChange(String(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectPopup>
                    {durations.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectPopup>
                </Select>
              </Field>
            )}
          </form.Field>
          <form.Field name="reason">
            {(field) => (
              <Field name={field.name}>
                <FieldLabel>Reason (optional)</FieldLabel>
                <Textarea
                  value={field.state.value}
                  placeholder="Shown to the member when they try to sign in"
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
              </Field>
            )}
          </form.Field>
          {banUser.error && (
            <Alert variant="error">
              <AlertDescription>{banUser.error.message}</AlertDescription>
            </Alert>
          )}
        </Form>
        <AlertDialogFooter>
          <AlertDialogClose render={<Button variant="ghost" />}>Cancel</AlertDialogClose>
          <Button
            type="submit"
            form="ban-member-form"
            variant="destructive"
            loading={banUser.isPending}
          >
            Ban member
          </Button>
        </AlertDialogFooter>
      </AlertDialogPopup>
    </AlertDialog>
  );
}
