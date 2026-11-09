import { useForm } from "@tanstack/react-form";

import { z } from "zod";

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
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const schema = z.object({ password: z.string().min(1, "Enter your password to continue") });

type PasswordConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  pending?: boolean;
  onConfirm: (password: string) => void;
};

/** Re-authentication step shared by every sensitive account action. */
export function PasswordConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  destructive,
  pending,
  onConfirm,
}: PasswordConfirmDialogProps) {
  const form = useForm({
    defaultValues: { password: "" },
    validators: { onSubmit: schema },
    onSubmit: ({ value }) => onConfirm(value.password),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) form.reset();
        onOpenChange(next);
      }}
    >
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <Form
            id="password-confirm-form"
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
                  <FieldLabel>Password</FieldLabel>
                  <Input
                    type="password"
                    autoComplete="current-password"
                    autoFocus
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
          </Form>
        </DialogPanel>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
          <Button
            type="submit"
            form="password-confirm-form"
            variant={destructive ? "destructive" : "default"}
            loading={pending}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
