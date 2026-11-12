import { useState } from "react";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

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
import { Textarea } from "@/components/ui/textarea";
import { workspaceKeys } from "@/data/workspace/keys";
import { createRoleMutationOptions } from "@/data/workspace/roles";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(64, "Name must be 64 characters or fewer"),
  description: z.string().trim().max(300, "Description must be 300 characters or fewer"),
});

export function CreateRoleDialog({ workspace }: { workspace: string }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const createRole = useMutation({
    ...createRoleMutationOptions,
    onSuccess: async (role) => {
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.roles() });
      setOpen(false);
      await navigate({
        to: "/workspaces/$workspace/settings/members/roles/$roleId",
        params: { workspace, roleId: String(role.id) },
      });
    },
  });

  const form = useForm({
    defaultValues: { name: "", description: "" },
    validators: { onSubmit: schema },
    onSubmit: ({ value }) =>
      createRole.mutate({
        workspace,
        name: value.name.trim(),
        description: value.description.trim() || null,
      }),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          form.reset();
          createRole.reset();
        }
      }}
    >
      <DialogTrigger render={<Button size="sm" />}>
        <PlusIcon />
        New role
      </DialogTrigger>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>New role</DialogTitle>
          <DialogDescription>
            Name the role now and choose what it can do on the next screen.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <Form
            id="create-role-form"
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              void form.handleSubmit();
            }}
          >
            <form.Field name="name">
              {(field) => (
                <Field
                  name={field.name}
                  invalid={field.state.meta.isTouched && !field.state.meta.isValid}
                >
                  <FieldLabel>Name</FieldLabel>
                  <Input
                    autoFocus
                    autoComplete="off"
                    placeholder="Support"
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
            <form.Field name="description">
              {(field) => (
                <Field name={field.name}>
                  <FieldLabel>Description</FieldLabel>
                  <Textarea
                    placeholder="Optional"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                </Field>
              )}
            </form.Field>
            {createRole.error && (
              <Alert variant="error">
                <AlertDescription>{createRole.error.message}</AlertDescription>
              </Alert>
            )}
          </Form>
        </DialogPanel>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
          <Button type="submit" form="create-role-form" loading={createRole.isPending}>
            Create role
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
