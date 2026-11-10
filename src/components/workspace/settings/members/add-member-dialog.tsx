import { useState } from "react";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { PlusIcon } from "lucide-react";
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
import { createUserMutationOptions } from "@/data/admin/create-user";
import { workspaceKeys } from "@/data/workspace/keys";

import { RoleSelect, type MemberRole } from "./role-select";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["admin", "user"]),
  emailVerified: z.boolean(),
});

export function AddMemberDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const createUser = useMutation({
    ...createUserMutationOptions,
    onSuccess: async (_data, values) => {
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.members() });
      toastManager.add({ type: "success", title: `${values.name} was added` });
      setOpen(false);
    },
  });

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "user" as MemberRole,
      emailVerified: true,
    },
    validators: { onSubmit: schema },
    onSubmit: ({ value }) => createUser.mutate({ ...value, name: value.name.trim() }),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          form.reset();
          createUser.reset();
        }
      }}
    >
      <DialogTrigger render={<Button size="sm" />}>
        <PlusIcon />
        Add member
      </DialogTrigger>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Add a member</DialogTitle>
          <DialogDescription>
            Create an account for someone. Share the password with them securely.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <Form
            id="add-member-form"
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              form.handleSubmit();
            }}
          >
            <form.Field name="name">
              {(field) => (
                <Field
                  name={field.name}
                  invalid={field.state.meta.isTouched && !field.state.meta.isValid}
                >
                  <FieldLabel>Full name</FieldLabel>
                  <Input
                    type="text"
                    autoComplete="off"
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
            <form.Field name="email">
              {(field) => (
                <Field
                  name={field.name}
                  invalid={field.state.meta.isTouched && !field.state.meta.isValid}
                >
                  <FieldLabel>Email address</FieldLabel>
                  <Input
                    type="email"
                    autoComplete="off"
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
                    {field.state.meta.errors.map((item) => item?.message).join(", ")}
                  </FieldError>
                </Field>
              )}
            </form.Field>
            <form.Field name="role">
              {(field) => (
                <Field name={field.name}>
                  <FieldLabel>Role</FieldLabel>
                  <RoleSelect value={field.state.value} onValueChange={field.handleChange} />
                </Field>
              )}
            </form.Field>
            <form.Field name="emailVerified">
              {(field) => (
                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-col gap-0.5">
                    <p className="font-medium text-sm">Email verified</p>
                    <p className="text-muted-foreground text-sm">
                      Let them sign in right away without confirming their email.
                    </p>
                  </div>
                  <Switch
                    aria-label="Email verified"
                    checked={field.state.value}
                    onCheckedChange={field.handleChange}
                  />
                </div>
              )}
            </form.Field>
            {createUser.error && (
              <Alert variant="error">
                <AlertDescription>{createUser.error.message}</AlertDescription>
              </Alert>
            )}
          </Form>
        </DialogPanel>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
          <Button type="submit" form="add-member-form" loading={createUser.isPending}>
            Add member
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
