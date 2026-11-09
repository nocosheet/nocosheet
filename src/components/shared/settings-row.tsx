import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { cn } from "@/lib/utils";

type SettingsRowProps = {
  title: string;
  description: string;
  badge?: React.ReactNode;
  /** Turns the row into a form field: the title becomes the input's label. */
  field?: { name: string; invalid: boolean };
  children?: React.ReactNode;
};

const rowClassName = "grid items-center gap-4 p-4 not-last:border-b md:grid-cols-2 md:px-6";

export function SettingsRow({ title, description, badge, field, children }: SettingsRowProps) {
  const content = (
    <>
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          {field ? (
            <FieldLabel className="text-sm">{title}</FieldLabel>
          ) : (
            <p className="font-medium text-sm">{title}</p>
          )}
          {badge}
        </div>
        {field ? (
          <FieldDescription className="text-sm">{description}</FieldDescription>
        ) : (
          <p className="text-muted-foreground text-sm">{description}</p>
        )}
      </div>
      {children && <div className="flex min-w-0 flex-col gap-2">{children}</div>}
    </>
  );

  if (field) {
    return (
      <Field
        name={field.name}
        invalid={field.invalid}
        className={cn(rowClassName, "items-center gap-4")}
      >
        {content}
      </Field>
    );
  }

  return <div className={rowClassName}>{content}</div>;
}
