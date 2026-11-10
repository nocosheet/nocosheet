import { Field, FieldItem, FieldLabel } from "@/components/ui/field";
import { Fieldset, FieldsetLegend } from "@/components/ui/fieldset";
import { Radio, RadioGroup } from "@/components/ui/radio-group";
import { ACCENTS, type Accent } from "@/lib/preferences";

type AccentPickerProps = {
  value: Accent;
  onValueChange: (value: Accent) => void;
};

export function AccentPicker({ value, onValueChange }: AccentPickerProps) {
  return (
    <Field name="accent" render={(props) => <Fieldset {...props} />}>
      <FieldsetLegend className="sr-only">Accent color</FieldsetLegend>
      <RadioGroup
        className="flex-row flex-wrap gap-3"
        value={value}
        onValueChange={(next) => onValueChange(next as Accent)}
      >
        {ACCENTS.map((accent) => (
          <FieldItem key={accent.value}>
            <FieldLabel className="cursor-pointer" title={accent.label}>
              <Radio
                className="peer sr-only absolute"
                value={accent.value}
                aria-label={accent.label}
              />
              <span
                className="block size-7 rounded-full shadow-xs transition-shadow peer-data-disabled:opacity-64 peer-data-checked:ring-2 peer-data-checked:ring-foreground/60 peer-data-checked:ring-offset-2 peer-data-checked:ring-offset-background peer-focus-visible:ring-2 peer-focus-visible:ring-ring"
                style={{ backgroundColor: accent.swatch }}
              />
            </FieldLabel>
          </FieldItem>
        ))}
      </RadioGroup>
    </Field>
  );
}
